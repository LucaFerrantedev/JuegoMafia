import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  ChatMessage
} from '@operacion-filtracion/shared';
import { Room } from './models/Room';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Almacén de salas en memoria
const rooms = new Map<string, Room>();
const socketToRoom = new Map<string, string>();

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
  console.log(`[Socket] Conectado: ${socket.id}`);

  // ==========================================
  // Lobby Handlers
  // ==========================================

  socket.on('lobby:create', ({ nickname, avatarSeed }) => {
    let roomCode = generateRoomCode();
    while (rooms.has(roomCode)) {
      roomCode = generateRoomCode();
    }

    const room = new Room(roomCode, io);
    rooms.set(roomCode, room);
    socketToRoom.set(socket.id, roomCode);

    socket.join(roomCode);
    room.addPlayer(socket.id, nickname, avatarSeed);
    console.log(`[Lobby] Sala creada ${roomCode} por ${nickname}`);
  });

  socket.on('lobby:join', ({ roomCode, nickname, avatarSeed }) => {
    const code = roomCode.toUpperCase().trim();
    const room = rooms.get(code);

    if (!room) {
      socket.emit('error:notification', { message: 'La sala especificada no existe.' });
      return;
    }

    if (room.state.phase !== 'LOBBY') {
      socket.emit('error:notification', { message: 'La partida ya ha comenzado.' });
      return;
    }

    socketToRoom.set(socket.id, code);
    socket.join(code);
    room.addPlayer(socket.id, nickname, avatarSeed);
    console.log(`[Lobby] ${nickname} se unió a la sala ${code}`);
  });

  socket.on('lobby:toggle_ready', () => {
    const code = socketToRoom.get(socket.id);
    if (!code) return;
    const room = rooms.get(code);
    room?.toggleReady(socket.id);
  });

  socket.on('lobby:start_game', () => {
    const code = socketToRoom.get(socket.id);
    if (!code) return;
    const room = rooms.get(code);
    if (!room) return;

    const player = room.state.players[socket.id];
    if (!player || !player.isHost) {
      socket.emit('error:notification', { message: 'Solo el anfitrión puede iniciar la partida.' });
      return;
    }

    const started = room.startGame();
    if (!started) {
      socket.emit('error:notification', {
        message: 'Se requiere un mínimo de 4 jugadores para iniciar.'
      });
    }
  });

  // ==========================================
  // Chat & Mensajería Handlers
  // ==========================================

  socket.on('chat:send_message', ({ channel, text }) => {
    const code = socketToRoom.get(socket.id);
    if (!code) return;
    const room = rooms.get(code);
    if (!room) return;

    const sender = room.state.players[socket.id];
    if (!sender) return;

    const sanitizedText = text.trim().slice(0, 240);
    if (!sanitizedText) return;

    const message: ChatMessage = {
      id: Math.random().toString(36).substring(7),
      senderId: sender.id,
      senderNickname: sender.nickname,
      channel,
      text: sanitizedText,
      timestamp: Date.now()
    };

    // Chat General diurno
    if (channel === 'PUBLIC') {
      if (!sender.isAlive) {
        socket.emit('error:notification', { message: 'Los agentes caídos solo pueden comunicarse en el canal de espectadores.' });
        return;
      }
      if (sender.isSilenced) {
        socket.emit('error:notification', { message: 'Tu terminal está infectado con malware DDoS. Estás silenciado por hoy.' });
        return;
      }
      if (room.state.phase === 'NIGHT_OPERATIONS' || room.state.phase === 'ROLE_ASSIGNMENT') {
        socket.emit('error:notification', { message: 'La red pública está caída durante la noche.' });
        return;
      }

      io.to(code).emit('chat:message', message);
    }

    // Chat Encriptado de la Mafia (Noche)
    else if (channel === 'MAFIA') {
      if (sender.faction !== 'CARTEL' || !sender.isAlive) {
        socket.emit('error:notification', { message: 'Acceso no autorizado al canal del Cártel.' });
        return;
      }

      room.recordMafiaNightMessage(sanitizedText);

      // Distribuir solo a los miembros del Cártel
      Object.values(room.state.players)
        .filter(p => p.faction === 'CARTEL')
        .forEach(cartelMember => {
          io.to(cartelMember.id).emit('chat:message', message);
        });
    }

    // Canal de Espectadores
    else if (channel === 'SPECTATOR') {
      if (sender.isAlive && room.state.phase !== 'GAME_OVER') {
        socket.emit('error:notification', { message: 'Canal reservado para agentes eliminados.' });
        return;
      }

      // Enviar a los muertos y al terminar la partida
      Object.values(room.state.players)
        .filter(p => !p.isAlive || room.state.phase === 'GAME_OVER')
        .forEach(spectator => {
          io.to(spectator.id).emit('chat:message', message);
        });
    }
  });

  socket.on('chat:send_dm', ({ targetPlayerId, text }) => {
    const code = socketToRoom.get(socket.id);
    if (!code) return;
    const room = rooms.get(code);
    if (!room) return;

    const ok = room.sendDirectMessage(socket.id, targetPlayerId, text);
    if (!ok) {
      socket.emit('error:notification', {
        message: 'No puedes enviar este mensaje directo (límite alcanzado o estás silenciado).'
      });
    }
  });

  // ==========================================
  // Tribunal y Votación
  // ==========================================

  socket.on('court:nominate', ({ suspectPlayerId }) => {
    const code = socketToRoom.get(socket.id);
    if (!code) return;
    const room = rooms.get(code);
    room?.nominateSuspect(socket.id, suspectPlayerId);
  });

  socket.on('court:vote_verdict', ({ vote }) => {
    const code = socketToRoom.get(socket.id);
    if (!code) return;
    const room = rooms.get(code);
    room?.castVerdict(socket.id, vote);
  });

  // ==========================================
  // Operaciones Nocturnas
  // ==========================================

  socket.on('night:submit_action', (actionData) => {
    const code = socketToRoom.get(socket.id);
    if (!code) return;
    const room = rooms.get(code);
    room?.submitNightAction(socket.id, actionData);
  });

  // ==========================================
  // Desconexión
  // ==========================================

  socket.on('disconnect', () => {
    const code = socketToRoom.get(socket.id);
    if (code) {
      const room = rooms.get(code);
      if (room) {
        room.removePlayer(socket.id);
        if (Object.keys(room.state.players).length === 0) {
          rooms.delete(code);
          console.log(`[Lobby] Sala ${code} eliminada por inactividad.`);
        }
      }
      socketToRoom.delete(socket.id);
    }
    console.log(`[Socket] Desconectado: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`📡 Servidor de Operación Filtración escuchando en el puerto ${PORT}`);
});
