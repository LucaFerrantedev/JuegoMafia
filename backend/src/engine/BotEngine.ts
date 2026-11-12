import {
  RoleId,
  PlayerState,
  PlayerNightAction,
  DailyTrendId,
  BotPersonality,
  IntelReport
} from '@operacion-filtracion/shared';
import { generateBotMessage, ChatIntent } from './BotChatGenerator';
import type { Room } from '../models/Room';

export interface BotMemory {
  botId: string;
  personality: BotPersonality;
  suspicionMatrix: Record<string, number>; // playerId -> 0 a 100 (50 inicial)
  knownInfo: string[];
  investigatedPlayerIds: Set<string>;
  fakeRoleClaim: RoleId;
}

const CITIZEN_FAKES: RoleId[] = [
  'PARAMEDIC',
  'OSINT_ANALYST',
  'SMART_CAM_CITIZEN',
  'JOURNALIST'
];

export class BotEngine {
  private room: Room;
  private memories: Map<string, BotMemory> = new Map();
  private activeTimeouts: NodeJS.Timeout[] = [];
  private dayChatInterval?: NodeJS.Timeout;

  constructor(room: Room) {
    this.room = room;
  }

  // Inicializa la memoria de los bots al comenzar la partida
  public initMatch(): void {
    this.clearAllTimers();
    this.memories.clear();

    const players = this.room.state.players;
    Object.values(players).forEach(p => {
      if (!p.isBot) return;

      const personality: BotPersonality = p.personality || 'analitico';
      const matrix: Record<string, number> = {};

      Object.values(players).forEach(other => {
        if (other.id !== p.id) {
          // Si ambos son mafia, se conocen y la sospecha es 0
          if (p.faction === 'CARTEL' && other.faction === 'CARTEL') {
            matrix[other.id] = 0;
          } else {
            // Sospecha inicial con ligera variación según personalidad
            const base = personality === 'agresivo' ? 55 : personality === 'callado' ? 45 : 50;
            const variance = Math.floor(Math.random() * 11) - 5;
            matrix[other.id] = Math.max(10, Math.min(90, base + variance));
          }
        }
      });

      // Asignar coartada de rol falso consistente si es Mafia o Neutral
      let fakeRoleClaim: RoleId = p.role;
      if (p.faction !== 'CITIZEN') {
        const randIndex = Math.floor(Math.random() * CITIZEN_FAKES.length);
        fakeRoleClaim = CITIZEN_FAKES[randIndex];
      }

      this.memories.set(p.id, {
        botId: p.id,
        personality,
        suspicionMatrix: matrix,
        knownInfo: [],
        investigatedPlayerIds: new Set<string>(),
        fakeRoleClaim
      });
    });
  }

  public clearAllTimers(): void {
    this.activeTimeouts.forEach(t => clearTimeout(t));
    this.activeTimeouts = [];
    if (this.dayChatInterval) {
      clearInterval(this.dayChatInterval);
      this.dayChatInterval = undefined;
    }
  }

  // ==========================================
  // Actualización de Sospechas (Heurísticas)
  // ==========================================

  public onPlayerNominated(voterId: string, suspectId: string): void {
    const memory = this.memories.get(suspectId);
    if (memory && voterId !== suspectId) {
      // Si alguien acusa al bot: +20 de sospecha hacia el acusador
      const current = memory.suspicionMatrix[voterId] ?? 50;
      memory.suspicionMatrix[voterId] = Math.min(100, current + 20);
    }
  }

  public onPlayerExecuted(executedPlayer: PlayerState): void {
    const isCartel = executedPlayer.faction === 'CARTEL';
    const verdictVotes = this.room.state.verdictVotes;

    this.memories.forEach(mem => {
      if (isCartel) {
        // Murió un Mafia: -25 sospecha a quienes votaron culpable, +30 a quienes votaron inocente
        Object.entries(verdictVotes).forEach(([voterId, vote]) => {
          if (voterId === mem.botId) return;
          const current = mem.suspicionMatrix[voterId] ?? 50;
          if (vote === 'GUILTY') {
            mem.suspicionMatrix[voterId] = Math.max(0, current - 25);
          } else if (vote === 'INNOCENT') {
            mem.suspicionMatrix[voterId] = Math.min(100, current + 30);
          }
        });
      }
    });
  }

  public recordNightIntel(botId: string, intel: IntelReport, targetId?: string): void {
    const memory = this.memories.get(botId);
    if (!memory) return;

    memory.knownInfo.push(intel.content);

    if (targetId) {
      memory.investigatedPlayerIds.add(targetId);
      const isIncriminating =
        intel.content.includes('ALERTA ROJA') ||
        intel.content.includes('REDES OPUESTAS') ||
        intel.content.includes('MOVIMIENTO DETECTADO');

      if (isIncriminating) {
        memory.suspicionMatrix[targetId] = 95;
      } else if (intel.content.includes('INFORME RUTINARIO') || intel.content.includes('NODO COINCIDENTE')) {
        memory.suspicionMatrix[targetId] = 10;
      }
    }
  }

  // ==========================================
  // Acciones Nocturnas Programadas
  // ==========================================

  public scheduleBotNightActions(): void {
    this.clearAllTimers();
    const aliveBots = Object.values(this.room.state.players).filter(p => p.isBot && p.isAlive);

    aliveBots.forEach(bot => {
      const memory = this.memories.get(bot.id);
      if (!memory) return;

      const delay = Math.floor(Math.random() * 5000) + 2000; // 2s a 7s
      const timer = setTimeout(() => {
        if (this.room.state.phase !== 'NIGHT_OPERATIONS' || !bot.isAlive) return;
        this.executeBotNightAction(bot, memory);
      }, delay);

      this.activeTimeouts.push(timer);
    });
  }

  private executeBotNightAction(bot: PlayerState, memory: BotMemory): void {
    const alivePlayers = Object.values(this.room.state.players).filter(p => p.isAlive);
    const aliveNonCartel = alivePlayers.filter(p => p.faction !== 'CARTEL');

    switch (bot.role) {
      case 'CEO': {
        // Ataca al ciudadano vivo con menor sospecha (más confiable/peligroso para la mafia) o más activo
        if (aliveNonCartel.length > 0) {
          const sorted = [...aliveNonCartel].sort((a, b) => {
            const suspA = memory.suspicionMatrix[a.id] ?? 50;
            const suspB = memory.suspicionMatrix[b.id] ?? 50;
            return suspA - suspB; // menor sospecha = más confiable ciudadano = mejor blanco
          });
          const target = sorted[0];
          this.room.submitNightAction(bot.id, {
            type: 'CARTEL_KILL',
            targetId: target.id
          });
        }
        break;
      }

      case 'BLACK_HAT_HACKER': {
        if (aliveNonCartel.length > 0) {
          const target = aliveNonCartel[Math.floor(Math.random() * aliveNonCartel.length)];
          const mode = Math.random() > 0.5 ? 'CANCEL_NIGHT' : 'SILENCE_DAY';
          this.room.submitNightAction(bot.id, {
            type: 'HACKER_DDOS',
            targetId: target.id,
            meta: { ddosMode: mode }
          });
        }
        break;
      }

      case 'DEEPFAKE_SPECIALIST': {
        if (bot.remainingAbilityUses > 0 && aliveNonCartel.length > 0) {
          // 50% de probabilidad de usarlo esta noche
          if (Math.random() > 0.5) {
            const target = aliveNonCartel[Math.floor(Math.random() * aliveNonCartel.length)];
            this.room.submitNightAction(bot.id, {
              type: 'DEEPFAKE_FRAME',
              targetId: target.id
            });
          }
        }
        break;
      }

      case 'PARAMEDIC': {
        const canSelfHeal = bot.lastHealedTargetId !== bot.id;
        // 40% auto-protección, 60% al jugador de mayor confianza (menor sospecha)
        if (canSelfHeal && Math.random() < 0.4) {
          this.room.submitNightAction(bot.id, {
            type: 'PARAMEDIC_HEAL',
            targetId: bot.id
          });
        } else {
          const candidates = alivePlayers.filter(p => p.id !== bot.lastHealedTargetId);
          if (candidates.length > 0) {
            const sorted = [...candidates].sort((a, b) => {
              const suspA = memory.suspicionMatrix[a.id] ?? 50;
              const suspB = memory.suspicionMatrix[b.id] ?? 50;
              return suspA - suspB;
            });
            this.room.submitNightAction(bot.id, {
              type: 'PARAMEDIC_HEAL',
              targetId: sorted[0].id
            });
          }
        }
        break;
      }

      case 'OSINT_ANALYST': {
        const uninvestigated = alivePlayers.filter(
          p => p.id !== bot.id && !memory.investigatedPlayerIds.has(p.id)
        );
        if (uninvestigated.length > 0) {
          // Prefiere sospechosos entre 55 y 80
          const candidates = uninvestigated.filter(p => {
            const s = memory.suspicionMatrix[p.id] ?? 50;
            return s >= 50 && s <= 85;
          });
          const target = candidates.length > 0
            ? candidates[Math.floor(Math.random() * candidates.length)]
            : uninvestigated[0];

          this.room.submitNightAction(bot.id, {
            type: 'OSINT_INVESTIGATE',
            targetId: target.id
          });
        }
        break;
      }

      case 'JOURNALIST': {
        const others = alivePlayers.filter(p => p.id !== bot.id);
        if (others.length >= 2) {
          const target1 = others[Math.floor(Math.random() * others.length)];
          const remaining = others.filter(p => p.id !== target1.id);
          const target2 = remaining[Math.floor(Math.random() * remaining.length)];

          this.room.submitNightAction(bot.id, {
            type: 'JOURNALIST_COMPARE',
            targetId: target1.id,
            secondaryTargetId: target2.id
          });
        }
        break;
      }

      case 'SMART_CAM_CITIZEN': {
        if (bot.remainingAbilityUses > 0) {
          // Activa en ronda 1 o 2 con 70% de probabilidad
          if (Math.random() < 0.7) {
            this.room.submitNightAction(bot.id, {
              type: 'SMART_CAM_ACTIVATE'
            });
          }
        }
        break;
      }
    }
  }

  // ==========================================
  // Comportamiento de Chat Diurno
  // ==========================================

  public scheduleBotDayChat(): void {
    this.clearAllTimers();

    // Comentarios cada 6 a 12 segundos
    this.dayChatInterval = setInterval(() => {
      if (this.room.state.phase !== 'DAY_CHAT_AND_DM') return;

      const aliveBots = Object.values(this.room.state.players).filter(p => p.isBot && p.isAlive && !p.isSilenced);
      if (aliveBots.length === 0) return;

      const bot = aliveBots[Math.floor(Math.random() * aliveBots.length)];
      const memory = this.memories.get(bot.id);
      if (!memory) return;

      // Determinar intención según estado del bot y sospechas
      let intent: ChatIntent = 'OBSERVACION_CASUAL';
      let targetNickname: string | undefined;

      // Buscar si tiene algún jugador con sospecha muy alta (>= 80)
      const sortedSuspects = Object.entries(memory.suspicionMatrix)
        .filter(([id]) => {
          const p = this.room.state.players[id];
          return p && p.isAlive && id !== bot.id;
        })
        .sort((a, b) => b[1] - a[1]);

      if (sortedSuspects.length > 0) {
        const [topId, topScore] = sortedSuspects[0];
        const suspectPlayer = this.room.state.players[topId];
        if (suspectPlayer) {
          if (topScore >= 85) {
            intent = 'ACUSACION_FUERTE';
            targetNickname = suspectPlayer.nickname;
          } else if (topScore >= 70 && Math.random() < 0.6) {
            intent = 'SOSPECHA_GENERAL';
            targetNickname = suspectPlayer.nickname;
          }
        }
      }

      // Posibilidad de comentar la tendencia del día
      if (intent === 'OBSERVACION_CASUAL' && this.room.state.activeTrend && Math.random() < 0.35) {
        intent = 'COMENTARIO_TENDENCIA';
      }

      const text = generateBotMessage(intent, {
        botNickname: bot.nickname,
        personality: memory.personality,
        targetNickname,
        claimedRole: memory.fakeRoleClaim,
        activeTrend: this.room.state.activeTrend,
        roundNumber: this.room.state.roundNumber
      });

      // Simular delay humano de 1.5s a 3s
      const delay = Math.floor(Math.random() * 1500) + 1500;
      const t = setTimeout(() => {
        if (this.room.state.phase === 'DAY_CHAT_AND_DM' && bot.isAlive && !bot.isSilenced) {
          this.room.broadcastChatMessage('PUBLIC', bot, text);
        }
      }, delay);
      this.activeTimeouts.push(t);
    }, Math.floor(Math.random() * 4000) + 7000);
  }

  // ==========================================
  // Nominaciones en Juicio
  // ==========================================

  public scheduleBotNominations(): void {
    this.clearAllTimers();
    const aliveBots = Object.values(this.room.state.players).filter(p => p.isBot && p.isAlive);

    aliveBots.forEach(bot => {
      const memory = this.memories.get(bot.id);
      if (!memory) return;

      const delay = Math.floor(Math.random() * 6500) + 1500; // 1.5s a 8s
      const timer = setTimeout(() => {
        if (this.room.state.phase !== 'NOMINATION_AND_DEFENSE' || !bot.isAlive) return;

        // Si ya hay alguien nominado, no necesita nominar
        if (this.room.state.nominatedPlayerId) return;

        // Elegir a quién nominar basándose en sospecha
        const sorted = Object.entries(memory.suspicionMatrix)
          .filter(([id]) => {
            const target = this.room.state.players[id];
            if (!target || !target.isAlive || id === bot.id) return false;
            // Si es mafia, no nomina a compañero salvo camuflaje extremo
            if (bot.faction === 'CARTEL' && target.faction === 'CARTEL') return false;
            return true;
          })
          .sort((a, b) => b[1] - a[1]);

        if (sorted.length > 0 && sorted[0][1] >= 60) {
          this.room.nominateSuspect(bot.id, sorted[0][0]);
        }
      }, delay);

      this.activeTimeouts.push(timer);
    });
  }

  // Defensa en el Estrado (cuando el bot es el acusado)
  public triggerBotDefense(accusedBotId: string): void {
    const bot = this.room.state.players[accusedBotId];
    const memory = this.memories.get(accusedBotId);
    if (!bot || !memory) return;

    const delay = 1500;
    const timer = setTimeout(() => {
      if (this.room.state.nominatedPlayerId !== accusedBotId) return;

      const speech = generateBotMessage('DEFENSA_ESTRADO', {
        botNickname: bot.nickname,
        personality: memory.personality,
        claimedRole: memory.fakeRoleClaim,
        roundNumber: this.room.state.roundNumber
      });

      this.room.broadcastChatMessage('PUBLIC', bot, speech);
    }, delay);

    this.activeTimeouts.push(timer);
  }

  // ==========================================
  // Votación de Veredicto Final
  // ==========================================

  public scheduleBotVerdicts(): void {
    this.clearAllTimers();
    const accusedId = this.room.state.nominatedPlayerId;
    if (!accusedId) return;

    const accused = this.room.state.players[accusedId];
    if (!accused) return;

    const aliveBots = Object.values(this.room.state.players).filter(p => p.isBot && p.isAlive && p.id !== accusedId);
    const isTwoFactor = this.room.state.activeTrend === 'TWO_FACTOR_REQUIRED';

    aliveBots.forEach(bot => {
      const memory = this.memories.get(bot.id);
      if (!memory) return;

      const delay = Math.floor(Math.random() * 6000) + 1500; // 1.5s a 7.5s
      const timer = setTimeout(() => {
        if (this.room.state.phase !== 'VERDICT_VOTE' || !bot.isAlive) return;

        let vote: 'GUILTY' | 'INNOCENT' | 'ABSTAIN' = 'ABSTAIN';
        const suspicion = memory.suspicionMatrix[accusedId] ?? 50;

        // Si el bot es Mafia y el acusado es compañero de Mafia
        if (bot.faction === 'CARTEL' && accused.faction === 'CARTEL') {
          // Voto de camuflaje solo si más del 70% ya votó culpable
          const guiltyVotes = Object.values(this.room.state.verdictVotes).filter(v => v === 'GUILTY').length;
          const totalAlive = Object.values(this.room.state.players).filter(p => p.isAlive).length;
          if (guiltyVotes / totalAlive >= 0.7) {
            vote = 'GUILTY';
          } else {
            vote = 'INNOCENT';
          }
        } else {
          // Ciudadano o Neutral votando
          if (suspicion >= 65) {
            vote = 'GUILTY';
          } else if (suspicion <= 40) {
            vote = 'INNOCENT';
          } else {
            vote = isTwoFactor ? (suspicion >= 50 ? 'GUILTY' : 'INNOCENT') : 'ABSTAIN';
          }
        }

        this.room.castVerdict(bot.id, vote);
      }, delay);

      this.activeTimeouts.push(timer);
    });
  }
}
