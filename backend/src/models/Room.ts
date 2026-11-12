import { Server, Socket } from 'socket.io';
import {
  GameState,
  PlayerState,
  GamePhase,
  RoleId,
  ClientToServerEvents,
  ServerToClientEvents,
  ChatMessage,
  DirectMessage,
  PlayerNightAction,
  ROLES,
  DailyTrendId
} from '@operacion-filtracion/shared';
import { PHASE_DURATIONS, RULES } from '../config/gameRules';
import { distributeRoles } from '../engine/RoleDistributor';
import { resolveNightOperations } from '../engine/NightResolver';
import { sanitizeGameState } from '../engine/AntiCheat';
import { selectDailyTrend } from '../engine/TrendsManager';

type GameServer = Server<ClientToServerEvents, ServerToClientEvents>;

export class Room {
  public code: string;
  public state: GameState;
  private io: GameServer;
  private timerInterval?: NodeJS.Timeout;
  private defenseTimeout?: NodeJS.Timeout;

  constructor(code: string, io: GameServer) {
    this.code = code;
    this.io = io;
    this.state = {
      roomCode: code,
      phase: 'LOBBY',
      roundNumber: 0,
      phaseDurationSeconds: 0,
      phaseTimeRemaining: 0,
      players: {},
      nominations: {},
      verdictVotes: {},
      pendingNightActions: {},
      cartelVotes: {},
      nightMafiaChatLog: []
    };
  }

  // ==========================================
  // Gestión de Jugadores
  // ==========================================

  public addPlayer(socketId: string, nickname: string, avatarSeed?: string): PlayerState {
    const isFirstPlayer = Object.keys(this.state.players).length === 0;
    const player: PlayerState = {
      id: socketId,
      nickname: nickname.trim().slice(0, 16),
      avatarSeed: avatarSeed || Math.random().toString(36).substring(7),
      isHost: isFirstPlayer,
      isReady: isFirstPlayer, // Host is ready by default
      isAlive: true,
      role: 'SMART_CAM_CITIZEN',
      faction: 'CITIZEN',
      isSilenced: false,
      isProtected: false,
      isDDoSedThisNight: false,
      visitedBy: [],
      dmsRemainingToday: RULES.MAX_DMS_PER_DAY,
      remainingAbilityUses: 0,
      ceoInvestigatedBefore: false,
      hasNominated: false
    };

    this.state.players[socketId] = player;
    this.syncAll();
    return player;
  }

  public removePlayer(socketId: string): void {
    const player = this.state.players[socketId];
    if (!player) return;

    if (this.state.phase === 'LOBBY') {
      delete this.state.players[socketId];
      // Si el host salió, reasignar
      if (player.isHost) {
        const remainingIds = Object.keys(this.state.players);
        if (remainingIds.length > 0) {
          this.state.players[remainingIds[0]].isHost = true;
          this.state.players[remainingIds[0]].isReady = true;
        }
      }
    } else {
      // En partida, desconectar cuenta como fallecido
      player.isAlive = false;
      this.checkWinConditions();
    }
    this.syncAll();
  }

  public toggleReady(socketId: string): void {
    if (this.state.phase !== 'LOBBY') return;
    const player = this.state.players[socketId];
    if (player) {
      player.isReady = !player.isReady;
      this.syncAll();
    }
  }

  // ==========================================
  // Ciclo de Vida del Juego (State Machine)
  // ==========================================

  public startGame(): boolean {
    const playerList = Object.values(this.state.players);
    if (playerList.length < RULES.MIN_PLAYERS) {
      return false;
    }

    // Asignar roles
    const assignedRoles = distributeRoles(playerList.length);
    playerList.forEach((player, idx) => {
      const roleId = assignedRoles[idx];
      const roleDef = ROLES[roleId];
      player.role = roleId;
      player.faction = roleDef.faction;
      player.remainingAbilityUses = roleDef.maxUses || 0;
      player.isAlive = true;
      player.isSilenced = false;
      player.isProtected = false;
    });

    // Asignar objetivo secreto al Hitman si existe
    const hitman = playerList.find(p => p.role === 'HITMAN');
    if (hitman) {
      const eligibleCitizens = playerList.filter(p => p.faction === 'CITIZEN');
      if (eligibleCitizens.length > 0) {
        const randIndex = Math.floor(Math.random() * eligibleCitizens.length);
        hitman.hitmanTargetPlayerId = eligibleCitizens[randIndex].id;
      }
    }

    this.state.roundNumber = 1;
    this.transitionToPhase('ROLE_ASSIGNMENT');
    return true;
  }

  private transitionToPhase(newPhase: GamePhase): void {
    this.stopTimer();
    this.state.phase = newPhase;

    let duration = 0;
    switch (newPhase) {
      case 'ROLE_ASSIGNMENT':
        duration = PHASE_DURATIONS.ROLE_ASSIGNMENT;
        break;
      case 'NIGHT_OPERATIONS':
        duration = PHASE_DURATIONS.NIGHT_OPERATIONS;
        this.prepareNight();
        break;
      case 'MORNING_NEWS_FEED':
        duration = PHASE_DURATIONS.MORNING_NEWS_FEED;
        this.processNightResolution();
        break;
      case 'DAY_CHAT_AND_DM':
        duration = PHASE_DURATIONS.DAY_CHAT_AND_DM;
        this.prepareDay();
        break;
      case 'NOMINATION_AND_DEFENSE':
        duration = PHASE_DURATIONS.NOMINATION_AND_DEFENSE;
        this.prepareNomination();
        break;
      case 'VERDICT_VOTE':
        duration = PHASE_DURATIONS.VERDICT_VOTE;
        this.prepareVerdict();
        break;
      case 'GAME_OVER':
        this.syncAll();
        return;
    }

    this.state.phaseDurationSeconds = duration;
    this.state.phaseTimeRemaining = duration;

    this.io.to(this.code).emit('game:phase_change', {
      phase: newPhase,
      durationSeconds: duration,
      roundNumber: this.state.roundNumber,
      trend: this.state.activeTrend
    });

    this.syncAll();
    this.startTimer(() => this.onPhaseTimerExpired());
  }

  private onPhaseTimerExpired(): void {
    switch (this.state.phase) {
      case 'ROLE_ASSIGNMENT':
        this.transitionToPhase('NIGHT_OPERATIONS');
        break;
      case 'NIGHT_OPERATIONS':
        this.transitionToPhase('MORNING_NEWS_FEED');
        break;
      case 'MORNING_NEWS_FEED':
        if (this.checkWinConditions()) return;
        this.transitionToPhase('DAY_CHAT_AND_DM');
        break;
      case 'DAY_CHAT_AND_DM':
        this.transitionToPhase('NOMINATION_AND_DEFENSE');
        break;
      case 'NOMINATION_AND_DEFENSE':
        if (this.state.nominatedPlayerId) {
          this.transitionToPhase('VERDICT_VOTE');
        } else {
          // Si nadie fue nominado, vuelve directo a la noche
          this.state.roundNumber++;
          this.transitionToPhase('NIGHT_OPERATIONS');
        }
        break;
      case 'VERDICT_VOTE':
        this.resolveVerdict();
        break;
    }
  }

  // ==========================================
  // Lógica Interna de Fases
  // ==========================================

  private prepareNight(): void {
    this.state.pendingNightActions = {};
    this.state.cartelVotes = {};
    this.state.nightMafiaChatLog = [];
    this.state.nominations = {};
    this.state.verdictVotes = {};
    this.state.nominatedPlayerId = undefined;

    // Resetear silencio de día anterior
    Object.values(this.state.players).forEach(p => {
      p.isSilenced = false;
    });

    this.sendSystemAlert('🌙 La red se apaga. Operaciones nocturnas en curso. Activen sus Apps.', 'info');
  }

  private processNightResolution(): void {
    const res = resolveNightOperations(this.state);

    // Seleccionar tendencia para este día (Día 2+)
    this.state.activeTrend = selectDailyTrend(this.state.roundNumber);

    // Filtrar un mensaje real de mafia si la tendencia es CHAT_LEAKS
    let leakedMsg: string | undefined;
    if (this.state.activeTrend === 'CHAT_LEAKS' && this.state.nightMafiaChatLog.length > 0) {
      const randIdx = Math.floor(Math.random() * this.state.nightMafiaChatLog.length);
      leakedMsg = this.state.nightMafiaChatLog[randIdx];
    }

    this.state.morningBulletin = {
      roundNumber: this.state.roundNumber,
      victims: res.victims,
      activeTrend: this.state.activeTrend,
      leakedMafiaMessage: leakedMsg,
      forensicNotes: res.forensicNotes
    };

    // Enviar reportes privados de inteligencia a los agentes
    Object.entries(res.intelReports).forEach(([playerId, report]) => {
      this.io.to(playerId).emit('night:intel_result', report);
    });

    this.syncAll();
  }

  private prepareDay(): void {
    // Resetear DMs para el nuevo día
    Object.values(this.state.players).forEach(p => {
      p.dmsRemainingToday = RULES.MAX_DMS_PER_DAY;
      p.hasNominated = false;
    });

    this.sendSystemAlert(`☀️ AMANECER DÍA ${this.state.roundNumber}. Canales de comunicación encriptada abiertos.`, 'info');

    if (this.state.activeTrend) {
      this.sendSystemAlert(`🚨 TENDENCIA ACTIVA: ${this.state.activeTrend}`, 'warning');
    }
  }

  private prepareNomination(): void {
    this.state.nominations = {};
    this.state.nominatedPlayerId = undefined;
    this.sendSystemAlert('⚖️ FASE DE NOMINACIÓN: Voten a quién subir al estrado de sospechosos.', 'warning');
  }

  private prepareVerdict(): void {
    this.state.verdictVotes = {};
    const accused = this.state.nominatedPlayerId ? this.state.players[this.state.nominatedPlayerId] : null;
    this.sendSystemAlert(`⚖️ VEREDICTO FINAL: Emita su voto sobre el acusado ${accused?.nickname || 'Sospechoso'}.`, 'critical');
  }

  public nominateSuspect(voterId: string, suspectId: string): void {
    if (this.state.phase !== 'NOMINATION_AND_DEFENSE') return;
    const voter = this.state.players[voterId];
    const suspect = this.state.players[suspectId];
    if (!voter || !voter.isAlive || !suspect || !suspect.isAlive) return;

    this.state.nominations[voterId] = suspectId;
    voter.hasNominated = true;

    // Calcular votos acumulados
    const tally: Record<string, number> = {};
    Object.values(this.state.nominations).forEach(target => {
      tally[target] = (tally[target] || 0) + 1;
    });

    const aliveCount = Object.values(this.state.players).filter(p => p.isAlive).length;
    const majorityThreshold = Math.floor(aliveCount / 2) + 1;

    // Chequeo de Instant Viral o Mayoría
    const isInstantViral = this.state.activeTrend === 'INSTANT_VIRAL';
    const targetVotes = tally[suspectId] || 0;

    if (
      (isInstantViral && targetVotes >= RULES.INSTANT_VIRAL_THRESHOLD) ||
      targetVotes >= majorityThreshold
    ) {
      this.state.nominatedPlayerId = suspectId;
      this.sendSystemAlert(`📢 ${suspect.nickname} ha alcanzado las acusaciones necesarias y sube al estrado.`, 'alert');
    }

    this.syncAll();
  }

  public castVerdict(voterId: string, vote: 'GUILTY' | 'INNOCENT' | 'ABSTAIN'): void {
    if (this.state.phase !== 'VERDICT_VOTE') return;
    const voter = this.state.players[voterId];
    if (!voter || !voter.isAlive) return;

    // 2FA Obligatorio no permite abstención
    if (this.state.activeTrend === 'TWO_FACTOR_REQUIRED' && vote === 'ABSTAIN') {
      this.io.to(voterId).emit('error:notification', {
        message: 'Tendencia 2FA activa: La abstención está bloqueada hoy.'
      });
      return;
    }

    voter.verdictVote = vote;
    this.state.verdictVotes[voterId] = vote;
    this.syncAll();
  }

  private resolveVerdict(): void {
    const accusedId = this.state.nominatedPlayerId;
    if (!accusedId || !this.state.players[accusedId]) {
      this.state.roundNumber++;
      this.transitionToPhase('NIGHT_OPERATIONS');
      return;
    }

    const accused = this.state.players[accusedId];
    let guiltyCount = 0;
    let innocentCount = 0;

    Object.values(this.state.verdictVotes).forEach(v => {
      if (v === 'GUILTY') guiltyCount++;
      if (v === 'INNOCENT') innocentCount++;
    });

    if (guiltyCount > innocentCount) {
      accused.isAlive = false;
      this.sendSystemAlert(`💥 El estrado dictó CULPABLE. ${accused.nickname} ha sido eliminado. Su rol era: ${ROLES[accused.role].name}.`, 'critical');

      // CONDICIÓN DE VICTORIA DEL TROLL
      if (accused.role === 'TROLL') {
        this.endGame('TROLL_SOLO');
        return;
      }
    } else {
      this.sendSystemAlert(`🛡️ El veredicto fue INOCENTE o EMPATE. ${accused.nickname} regresa al debate.`, 'info');
    }

    if (this.checkWinConditions()) return;

    this.state.roundNumber++;
    this.transitionToPhase('NIGHT_OPERATIONS');
  }

  // ==========================================
  // Condiciones de Victoria
  // ==========================================

  public checkWinConditions(): boolean {
    if (this.state.phase === 'GAME_OVER' || this.state.phase === 'LOBBY') return false;

    const alivePlayers = Object.values(this.state.players).filter(p => p.isAlive);
    const aliveCartel = alivePlayers.filter(p => p.faction === 'CARTEL');
    const aliveCitizens = alivePlayers.filter(p => p.faction === 'CITIZEN');

    // Victoria del Mercenario (Hitman)
    const hitman = Object.values(this.state.players).find(p => p.role === 'HITMAN');
    if (hitman && hitman.isAlive && hitman.hitmanTargetPlayerId) {
      const target = this.state.players[hitman.hitmanTargetPlayerId];
      if (target && !target.isAlive) {
        this.endGame('HITMAN_SOLO');
        return true;
      }
    }

    // Victoria del Cártel (igualan o superan a los ciudadanos vivos)
    if (aliveCartel.length >= (alivePlayers.length - aliveCartel.length)) {
      this.endGame('CARTEL');
      return true;
    }

    // Victoria de Ciudadanos (todos los del cartel eliminados)
    if (aliveCartel.length === 0) {
      this.endGame('CITIZEN');
      return true;
    }

    return false;
  }

  private endGame(winner: GameState['winner']): void {
    this.stopTimer();
    this.state.phase = 'GAME_OVER';
    this.state.winner = winner;

    const roster: Record<string, { nickname: string; role: RoleId }> = {};
    Object.values(this.state.players).forEach(p => {
      roster[p.id] = { nickname: p.nickname, role: p.role };
    });

    this.io.to(this.code).emit('game:over', {
      winner: winner || 'DRAW',
      roster
    });

    this.syncAll();
  }

  // ==========================================
  // Acciones Nocturnas & DMs
  // ==========================================

  public submitNightAction(playerId: string, action: Omit<PlayerNightAction, 'actorId'>): void {
    if (this.state.phase !== 'NIGHT_OPERATIONS') return;
    const player = this.state.players[playerId];
    if (!player || !player.isAlive) return;

    this.state.pendingNightActions[playerId] = {
      ...action,
      actorId: playerId
    };

    this.io.to(playerId).emit('night:action_ack', {
      success: true,
      message: 'Comando nocturno encriptado y programado para el amanecer.'
    });

    this.syncAll();
  }

  public recordMafiaNightMessage(message: string): void {
    this.state.nightMafiaChatLog.push(message);
  }

  public sendDirectMessage(senderId: string, targetId: string, text: string): boolean {
    const sender = this.state.players[senderId];
    const target = this.state.players[targetId];

    if (!sender || !target || !sender.isAlive || !target.isAlive) return false;
    if (this.state.phase !== 'DAY_CHAT_AND_DM') return false;
    if (sender.dmsRemainingToday <= 0) return false;
    if (sender.isSilenced) return false;

    sender.dmsRemainingToday -= 1;

    const dm: DirectMessage = {
      id: Math.random().toString(36).substring(7),
      senderId: sender.id,
      senderNickname: sender.nickname,
      recipientId: target.id,
      recipientNickname: target.nickname,
      text: text.slice(0, 160),
      timestamp: Date.now()
    };

    // Entregar DM a los 2 involucrados
    this.io.to(sender.id).emit('chat:direct_message', dm);
    this.io.to(target.id).emit('chat:direct_message', dm);

    // Alerta pública obligatoria requerida por el GDD:
    // "🔔 [Jugador A] envió un mensaje encriptado a [Jugador B]" (sin revelar texto)
    this.io.to(this.code).emit('chat:dm_alert', {
      senderNickname: sender.nickname,
      recipientNickname: target.nickname,
      timestamp: Date.now()
    });

    this.syncAll();
    return true;
  }

  // ==========================================
  // Sincronización y Timers
  // ==========================================

  public syncAll(): void {
    Object.keys(this.state.players).forEach(socketId => {
      const sanitized = sanitizeGameState(this.state, socketId);
      this.io.to(socketId).emit('game:state_sync', sanitized);
    });
  }

  private startTimer(onComplete: () => void): void {
    this.stopTimer();
    this.timerInterval = setInterval(() => {
      if (this.state.phaseTimeRemaining > 0) {
        this.state.phaseTimeRemaining -= 1;
        this.io.to(this.code).emit('game:timer_tick', {
          secondsRemaining: this.state.phaseTimeRemaining
        });
      } else {
        this.stopTimer();
        onComplete();
      }
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = undefined;
    }
  }

  public sendSystemAlert(text: string, level: 'info' | 'warning' | 'alert' | 'critical' = 'info'): void {
    this.io.to(this.code).emit('chat:system_alert', { text, level });
  }
}
