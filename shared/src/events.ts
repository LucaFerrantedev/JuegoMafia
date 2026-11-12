import { ClientGameState, GamePhase, PlayerNightAction, IntelReport } from './gameState';
import { DailyTrendId } from './trends';
import { RoleId, Faction } from './roles';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderNickname: string;
  channel: 'PUBLIC' | 'MAFIA' | 'SPECTATOR';
  text: string;
  timestamp: number;
}

export interface DirectMessage {
  id: string;
  senderId: string;
  senderNickname: string;
  recipientId: string;
  recipientNickname: string;
  text: string;
  timestamp: number;
}

export interface ClientToServerEvents {
  // Lobby
  'lobby:create': (payload: { nickname: string; avatarSeed?: string }) => void;
  'lobby:join': (payload: { roomCode: string; nickname: string; avatarSeed?: string }) => void;
  'lobby:toggle_ready': () => void;
  'lobby:start_game': () => void;
  'lobby:fill_bots': () => void;
  'lobby:add_bot': () => void;
  'lobby:remove_bot': () => void;

  // Chats y Mensajería
  'chat:send_message': (payload: { channel: 'PUBLIC' | 'MAFIA' | 'SPECTATOR'; text: string }) => void;
  'chat:send_dm': (payload: { targetPlayerId: string; text: string }) => void;

  // Juicio y Acusaciones
  'court:nominate': (payload: { suspectPlayerId: string }) => void;
  'court:vote_verdict': (payload: { vote: 'GUILTY' | 'INNOCENT' | 'ABSTAIN' }) => void;

  // Operaciones Nocturnas
  'night:submit_action': (payload: Omit<PlayerNightAction, 'actorId'>) => void;
  'night:cancel_action': () => void;
}

export interface ServerToClientEvents {
  // Estado y Sincronización
  'game:state_sync': (state: ClientGameState) => void;
  'game:phase_change': (payload: { phase: GamePhase; durationSeconds: number; roundNumber: number; trend?: DailyTrendId }) => void;
  'game:timer_tick': (payload: { secondsRemaining: number }) => void;
  'game:over': (payload: { winner: Faction | 'TROLL_SOLO' | 'HITMAN_SOLO' | 'DRAW'; roster: Record<string, { nickname: string; role: RoleId }> }) => void;

  // Chats y DMs
  'chat:message': (message: ChatMessage) => void;
  'chat:direct_message': (dm: DirectMessage) => void;
  'chat:dm_alert': (payload: { senderNickname: string; recipientNickname: string; timestamp: number }) => void;
  'chat:system_alert': (payload: { text: string; level: 'info' | 'warning' | 'alert' | 'critical' }) => void;

  // Respuestas nocturnas y reportes
  'night:intel_result': (report: IntelReport) => void;
  'night:action_ack': (payload: { success: boolean; message: string }) => void;

  // Errores
  'error:notification': (payload: { message: string }) => void;
}
