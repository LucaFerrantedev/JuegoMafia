import React from 'react';
import { useSocket } from '../../context/SocketContext';
import { ROLES, GamePhase } from '@operacion-filtracion/shared';
import { ShieldCheck, Wifi, Clock, BatteryCharging, Radio, User } from 'lucide-react';

const PHASE_NAMES: Record<GamePhase, { title: string; color: string }> = {
  LOBBY: { title: 'SALA DE ESPERA', color: 'bg-zinc-800 text-zinc-300 border-zinc-700' },
  ROLE_ASSIGNMENT: { title: 'ASIGNACIÓN DE IDENTIDAD', color: 'bg-indigo-950 text-indigo-300 border-indigo-700' },
  NIGHT_OPERATIONS: { title: 'NOCHE // OPERACIONES EN RED', color: 'bg-purple-950 text-purple-300 border-purple-600 animate-pulse' },
  MORNING_NEWS_FEED: { title: 'AMANECER // FEED DE NOTICIAS', color: 'bg-amber-950 text-amber-300 border-amber-600' },
  DAY_CHAT_AND_DM: { title: 'DÍA // DEBATE Y DMs', color: 'bg-emerald-950 text-emerald-300 border-emerald-600' },
  NOMINATION_AND_DEFENSE: { title: 'TRIBUNAL // NOMINACIONES', color: 'bg-orange-950 text-orange-300 border-orange-600' },
  VERDICT_VOTE: { title: 'JUICIO // VEREDICTO FINAL', color: 'bg-rose-950 text-rose-300 border-rose-600 animate-pulse' },
  GAME_OVER: { title: 'TERMINAL // FIN DE PARTIDA', color: 'bg-cyan-950 text-cyan-300 border-cyan-500' }
};

export const OSHeader: React.FC = () => {
  const { isConnected, gameState } = useSocket();

  if (!gameState) {
    return (
      <header className="w-full glass-panel border-b border-white/10 px-4 py-2.5 flex items-center justify-between text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 shadow-[0_0_8px_#10b981]' : 'bg-red-500'}`} />
          <span className="font-mono tracking-wider font-semibold">NEO-OS 2026 // v2.6.4</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 font-mono text-[11px] text-zinc-500">
            <Wifi className="w-3.5 h-3.5" /> 5G-UWB
          </span>
          <span className="flex items-center gap-1 font-mono text-[11px] text-zinc-500">
            <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" /> 98%
          </span>
        </div>
      </header>
    );
  }

  const phaseConfig = PHASE_NAMES[gameState.phase];
  const me = gameState.me;
  const roleDef = ROLES[me.role];

  return (
    <header className="w-full glass-panel border-b border-white/10 px-4 py-2 flex flex-col md:flex-row items-center justify-between gap-2 shadow-lg sticky top-0 z-40">
      {/* Izquierda: OS info & Status */}
      <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-400 shadow-[0_0_10px_#10b981]' : 'bg-rose-500'}`} />
          <span className="font-mono font-bold tracking-wider text-xs text-white">OPERACIÓN FILTRACIÓN</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400">
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-900/80 border border-white/5">
            <ShieldCheck className="w-3 h-3 text-cyan-400" /> E2EE
          </span>
          <span className="px-2 py-0.5 rounded bg-zinc-900/80 border border-white/5 font-mono text-cyan-300">
            SALA: {gameState.roomCode}
          </span>
        </div>
      </div>

      {/* Centro: Fase y Reloj Sincronizado */}
      <div className="flex items-center gap-2 w-full md:w-auto justify-center">
        <div className={`px-3 py-1 rounded-full text-xs font-mono font-semibold border flex items-center gap-2 ${phaseConfig.color}`}>
          <Radio className="w-3 h-3" />
          <span>{phaseConfig.title}</span>
        </div>

        {gameState.phase !== 'LOBBY' && gameState.phase !== 'GAME_OVER' && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-white/10 font-mono text-xs">
            <Clock className={`w-3.5 h-3.5 ${gameState.phaseTimeRemaining <= 5 ? 'text-rose-400 animate-spin' : 'text-zinc-400'}`} />
            <span className={`font-bold ${gameState.phaseTimeRemaining <= 5 ? 'text-rose-400 font-extrabold text-sm' : 'text-zinc-100'}`}>
              {gameState.phaseTimeRemaining}s
            </span>
          </div>
        )}
      </div>

      {/* Derecha: Mi Perfil */}
      <div className="flex items-center gap-2 w-full md:w-auto justify-end">
        {gameState.phase !== 'LOBBY' ? (
          <div className="flex items-center gap-2 bg-zinc-900/90 border border-white/10 px-3 py-1 rounded-xl">
            <div className={`w-2 h-2 rounded-full ${me.isAlive ? 'bg-emerald-400 shadow-[0_0_8px_#10b981]' : 'bg-zinc-600'}`} />
            <div className="text-left">
              <div className="text-xs font-semibold text-zinc-200 flex items-center gap-1">
                {me.nickname}
                {!me.isAlive && <span className="text-[10px] text-rose-400 font-mono">[CAÍDO]</span>}
              </div>
              <div className="text-[10px] font-mono text-cyan-400">
                {roleDef.name}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono">
            <User className="w-3.5 h-3.5 text-cyan-400" />
            <span>{me.nickname}</span>
          </div>
        )}
      </div>
    </header>
  );
};
