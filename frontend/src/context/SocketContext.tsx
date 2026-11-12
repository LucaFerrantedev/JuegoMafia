import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  ClientGameState,
  ClientToServerEvents,
  ServerToClientEvents,
  ChatMessage,
  DirectMessage,
  IntelReport,
  PlayerNightAction,
  RoleId,
  Faction
} from '@operacion-filtracion/shared';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface SystemAlert {
  id: string;
  text: string;
  level: 'info' | 'warning' | 'alert' | 'critical';
  timestamp: number;
}

interface SocketContextValue {
  socket: TypedSocket | null;
  isConnected: boolean;
  gameState: ClientGameState | null;
  chatMessages: ChatMessage[];
  directMessages: DirectMessage[];
  systemAlerts: SystemAlert[];
  latestIntel: IntelReport | null;
  notification: string | null;
  setNotification: (msg: string | null) => void;

  // Acciones
  createRoom: (nickname: string, avatarSeed?: string) => void;
  joinRoom: (roomCode: string, nickname: string, avatarSeed?: string) => void;
  toggleReady: () => void;
  startGame: () => void;
  fillWithBots: () => void;
  addBot: () => void;
  removeBot: () => void;
  sendChatMessage: (channel: 'PUBLIC' | 'MAFIA' | 'SPECTATOR', text: string) => void;
  sendDirectMessage: (targetPlayerId: string, text: string) => void;
  nominateSuspect: (suspectPlayerId: string) => void;
  castVerdict: (vote: 'GUILTY' | 'INNOCENT' | 'ABSTAIN') => void;
  submitNightAction: (action: Omit<PlayerNightAction, 'actorId'>) => void;
}

const SocketContext = createContext<SocketContextValue | null>(null);

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || (import.meta.env.PROD ? undefined : 'http://localhost:4000');

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<TypedSocket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [gameState, setGameState] = useState<ClientGameState | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [directMessages, setDirectMessages] = useState<DirectMessage[]>([]);
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);
  const [latestIntel, setLatestIntel] = useState<IntelReport | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    const s: TypedSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    s.on('connect', () => {
      console.log('🔗 Conectado al servidor de operaciones:', s.id);
      setIsConnected(true);
    });

    s.on('disconnect', () => {
      console.log('❌ Desconectado del servidor de operaciones');
      setIsConnected(false);
    });

    s.on('game:state_sync', (syncedState) => {
      setGameState(syncedState);
    });

    s.on('game:timer_tick', ({ secondsRemaining }) => {
      setGameState(prev => prev ? { ...prev, phaseTimeRemaining: secondsRemaining } : null);
    });

    s.on('chat:message', (msg) => {
      setChatMessages(prev => [...prev.slice(-99), msg]);
    });

    s.on('chat:direct_message', (dm) => {
      setDirectMessages(prev => [...prev.slice(-49), dm]);
    });

    s.on('chat:dm_alert', ({ senderNickname, recipientNickname, timestamp }) => {
      const alert: SystemAlert = {
        id: Math.random().toString(36).substring(7),
        text: `🔔 [${senderNickname}] envió un mensaje encriptado a [${recipientNickname}]`,
        level: 'warning',
        timestamp
      };
      setSystemAlerts(prev => [...prev.slice(-30), alert]);
    });

    s.on('chat:system_alert', ({ text, level }) => {
      const alert: SystemAlert = {
        id: Math.random().toString(36).substring(7),
        text,
        level,
        timestamp: Date.now()
      };
      setSystemAlerts(prev => [...prev.slice(-30), alert]);
    });

    s.on('night:intel_result', (intel) => {
      setLatestIntel(intel);
    });

    s.on('error:notification', ({ message }) => {
      setNotification(message);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  // Handlers
  const createRoom = useCallback((nickname: string, avatarSeed?: string) => {
    socket?.emit('lobby:create', { nickname, avatarSeed });
  }, [socket]);

  const joinRoom = useCallback((roomCode: string, nickname: string, avatarSeed?: string) => {
    socket?.emit('lobby:join', { roomCode, nickname, avatarSeed });
  }, [socket]);

  const toggleReady = useCallback(() => {
    socket?.emit('lobby:toggle_ready');
  }, [socket]);

  const startGame = useCallback(() => {
    socket?.emit('lobby:start_game');
  }, [socket]);

  const fillWithBots = useCallback(() => {
    socket?.emit('lobby:fill_bots');
  }, [socket]);

  const addBot = useCallback(() => {
    socket?.emit('lobby:add_bot');
  }, [socket]);

  const removeBot = useCallback(() => {
    socket?.emit('lobby:remove_bot');
  }, [socket]);

  const sendChatMessage = useCallback((channel: 'PUBLIC' | 'MAFIA' | 'SPECTATOR', text: string) => {
    socket?.emit('chat:send_message', { channel, text });
  }, [socket]);

  const sendDirectMessage = useCallback((targetPlayerId: string, text: string) => {
    socket?.emit('chat:send_dm', { targetPlayerId, text });
  }, [socket]);

  const nominateSuspect = useCallback((suspectPlayerId: string) => {
    socket?.emit('court:nominate', { suspectPlayerId });
  }, [socket]);

  const castVerdict = useCallback((vote: 'GUILTY' | 'INNOCENT' | 'ABSTAIN') => {
    socket?.emit('court:vote_verdict', { vote });
  }, [socket]);

  const submitNightAction = useCallback((action: Omit<PlayerNightAction, 'actorId'>) => {
    socket?.emit('night:submit_action', action);
  }, [socket]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        gameState,
        chatMessages,
        directMessages,
        systemAlerts,
        latestIntel,
        notification,
        setNotification,
        createRoom,
        joinRoom,
        toggleReady,
        startGame,
        fillWithBots,
        addBot,
        removeBot,
        sendChatMessage,
        sendDirectMessage,
        nominateSuspect,
        castVerdict,
        submitNightAction
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket debe ser usado dentro de SocketProvider');
  }
  return context;
};
