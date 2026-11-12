import { RoleId, Faction } from './roles';
import { DailyTrendId } from './trends';

export type GamePhase =
  | 'LOBBY'
  | 'ROLE_ASSIGNMENT'
  | 'NIGHT_OPERATIONS'
  | 'MORNING_NEWS_FEED'
  | 'DAY_CHAT_AND_DM'
  | 'NOMINATION_AND_DEFENSE'
  | 'VERDICT_VOTE'
  | 'GAME_OVER';

export type NightActionType =
  | 'CARTEL_KILL'
  | 'HACKER_DDOS'
  | 'DEEPFAKE_FRAME'
  | 'PARAMEDIC_HEAL'
  | 'OSINT_INVESTIGATE'
  | 'JOURNALIST_COMPARE'
  | 'SMART_CAM_ACTIVATE';

export interface PlayerNightAction {
  actorId: string;
  type: NightActionType;
  targetId?: string;
  secondaryTargetId?: string; // Para el Periodista (compara dos sospechosos)
  meta?: {
    ddosMode?: 'CANCEL_NIGHT' | 'SILENCE_DAY'; // Hacker Sombrero Negro
    fakeRoleId?: RoleId;                      // Especialista en Deepfakes
  };
}

export type BotPersonality = 'agresivo' | 'analitico' | 'callado' | 'caotico';

export interface PlayerState {
  id: string; // Socket ID o identificador de sesión
  nickname: string;
  avatarSeed: string;
  isHost: boolean;
  isReady: boolean;
  isAlive: boolean;
  role: RoleId;
  faction: Faction;
  isBot?: boolean;
  personality?: BotPersonality;

  // Estados temporales de ronda
  isSilenced: boolean;          // Silenciado por el hacker para el debate diurno
  isProtected: boolean;         // Protegido por paramédico durante la noche
  isDDoSedThisNight: boolean;   // Acción nocturna anulada por DDoS
  
  // Tracking para reglas nocturnas
  visitedBy: string[];          // Quiénes visitaron a este jugador esta noche
  lastHealedTargetId?: string;  // Paramédico no puede repetir objetivo
  dmsRemainingToday: number;    // Máximo 2 DMs diurnos
  remainingAbilityUses: number; // Deepfake (1), SmartCam (2)

  // Objetivos especiales
  hitmanTargetPlayerId?: string;
  ceoInvestigatedBefore: boolean;

  // Votaciones diurnas
  hasNominated: boolean;
  nominatedTargetId?: string;
  verdictVote?: 'GUILTY' | 'INNOCENT' | 'ABSTAIN';
}

export interface PublicPlayerInfo {
  id: string;
  nickname: string;
  avatarSeed: string;
  isHost: boolean;
  isReady: boolean;
  isAlive: boolean;
  isSilenced: boolean;
  hasNominated: boolean;
  hasVotedVerdict: boolean;
  isBot?: boolean;
  personality?: BotPersonality;
  revealedRole?: RoleId; // Visible solo si está muerto o terminó el juego
  revealedFaction?: Faction;
}

export interface MorningBulletin {
  roundNumber: number;
  victims: {
    playerId: string;
    nickname: string;
    revealedRole?: RoleId;
  }[];
  activeTrend?: DailyTrendId;
  leakedMafiaMessage?: string;
  forensicNotes: string[];
}

export interface IntelReport {
  type: 'OSINT' | 'JOURNALIST' | 'SMART_CAM';
  title: string;
  content: string;
  suspects?: string[];
  sameNetwork?: boolean;
}

export interface GameState {
  roomCode: string;
  phase: GamePhase;
  roundNumber: number;
  phaseDurationSeconds: number;
  phaseTimeRemaining: number;
  
  players: Record<string, PlayerState>;
  activeTrend?: DailyTrendId;
  
  // Sala de juicio
  nominatedPlayerId?: string;
  nominations: Record<string, string>; // voterId -> nomineeId
  verdictVotes: Record<string, 'GUILTY' | 'INNOCENT' | 'ABSTAIN'>;
  
  // Noche
  pendingNightActions: Record<string, PlayerNightAction>;
  cartelVotes: Record<string, string>; // cartelPlayerId -> targetId
  nightMafiaChatLog: string[];         // Mensajes enviados por la mafia anoche (para Leaks)
  
  // Reportes
  morningBulletin?: MorningBulletin;
  winner?: Faction | 'TROLL_SOLO' | 'HITMAN_SOLO' | 'DRAW';
}

export interface ClientGameState {
  roomCode: string;
  phase: GamePhase;
  roundNumber: number;
  phaseDurationSeconds: number;
  phaseTimeRemaining: number;
  activeTrend?: DailyTrendId;
  
  players: PublicPlayerInfo[];
  
  // Información personal autorizada
  me: {
    id: string;
    nickname: string;
    role: RoleId;
    faction: Faction;
    isAlive: boolean;
    isHost: boolean;
    isSilenced: boolean;
    dmsRemainingToday: number;
    remainingAbilityUses: number;
    hitmanTargetNickname?: string;
    teammates?: { id: string; nickname: string; role: RoleId }[];
    myNightAction?: PlayerNightAction;
  };

  // Juicio
  nominatedPlayer?: PublicPlayerInfo;
  nominationsCount: Record<string, number>;
  verdictTally?: {
    guiltyCount: number;
    innocentCount: number;
    abstainCount: number;
    // Si la tendencia es CLOUD_OUTAGE, voterDetails es undefined
    voterDetails?: Record<string, 'GUILTY' | 'INNOCENT' | 'ABSTAIN'>;
  };

  morningBulletin?: MorningBulletin;
  myIntelReport?: IntelReport;
  winner?: Faction | 'TROLL_SOLO' | 'HITMAN_SOLO' | 'DRAW';
}
