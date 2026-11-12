import React from 'react';
import { useSocket } from '../../context/SocketContext';
import { ROLES, Faction } from '@operacion-filtracion/shared';
import { Shield, Skull, Crosshair, Users, CheckCircle, Terminal } from 'lucide-react';

const FACTION_STYLES: Record<Faction, { name: string; bg: string; text: string; border: string; icon: any }> = {
  CARTEL: {
    name: 'EL CÁRTEL CORPORATIVO',
    bg: 'bg-rose-950/80',
    text: 'text-rose-400',
    border: 'border-rose-500/40',
    icon: Skull
  },
  CITIZEN: {
    name: 'CIUDADANOS Y AGENTES',
    bg: 'bg-emerald-950/80',
    text: 'text-emerald-400',
    border: 'border-emerald-500/40',
    icon: Shield
  },
  NEUTRAL: {
    name: 'AGENTES DEL CAOS',
    bg: 'bg-purple-950/80',
    text: 'text-purple-400',
    border: 'border-purple-500/40',
    icon: Crosshair
  }
};

export const RoleIntroModal: React.FC = () => {
  const { gameState } = useSocket();

  if (!gameState || gameState.phase !== 'ROLE_ASSIGNMENT') {
    return null;
  }

  const me = gameState.me;
  const roleDef = ROLES[me.role];
  const factionConfig = FACTION_STYLES[me.faction];
  const FactionIcon = factionConfig.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className={`max-w-lg w-full glass-panel rounded-2xl border ${factionConfig.border} p-6 shadow-2xl relative overflow-hidden scanline`}>
        {/* Glow de fondo */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <FactionIcon className={`w-5 h-5 ${factionConfig.text}`} />
            <span className={`text-xs font-mono font-bold tracking-widest ${factionConfig.text}`}>
              {factionConfig.name}
            </span>
          </div>
          <span className="text-xs font-mono text-zinc-500">
            {gameState.phaseTimeRemaining}s restantes
          </span>
        </div>

        <div className="text-center py-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-zinc-900 border border-white/10 mb-3 shadow-inner">
            <Terminal className={`w-8 h-8 ${factionConfig.text}`} />
          </div>
          <h2 className="text-2xl font-black text-white tracking-wide font-mono">
            {roleDef.name}
          </h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto font-mono">
            {roleDef.summary}
          </p>
        </div>

        {/* Descripción de Habilidades y Apps */}
        <div className="bg-zinc-900/90 rounded-xl p-4 border border-white/5 my-4 text-xs text-zinc-300 leading-relaxed font-sans">
          <div className="font-mono text-cyan-400 font-bold mb-1.5 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <span>// Manual Operativo de 2026:</span>
          </div>
          <p>{roleDef.description}</p>
        </div>

        {/* Información Exclusiva de Bando */}
        {me.faction === 'CARTEL' && me.teammates && (
          <div className="bg-rose-950/40 border border-rose-500/20 rounded-xl p-3.5 mb-4">
            <div className="flex items-center gap-2 text-rose-400 font-mono text-xs font-bold mb-2">
              <Users className="w-4 h-4" />
              <span>Sindicato del Cártel (Miembros Conectados):</span>
            </div>
            <div className="space-y-1">
              {me.teammates.map(t => (
                <div key={t.id} className="text-xs text-zinc-300 font-mono flex justify-between">
                  <span>• {t.nickname}</span>
                  <span className="text-rose-400">{ROLES[t.role].name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {me.role === 'HITMAN' && me.hitmanTargetNickname && (
          <div className="bg-purple-950/40 border border-purple-500/30 rounded-xl p-3.5 mb-4">
            <div className="flex items-center gap-2 text-purple-400 font-mono text-xs font-bold mb-1">
              <Crosshair className="w-4 h-4" />
              <span>CONTRATO DARK WEB:</span>
            </div>
            <p className="text-xs text-zinc-300">
              Objetivo a neutralizar:{' '}
              <span className="font-bold text-white font-mono bg-purple-900/60 px-2 py-0.5 rounded border border-purple-500/40">
                {me.hitmanTargetNickname}
              </span>
            </p>
          </div>
        )}

        <div className="text-center pt-2">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-emerald-400">
            <CheckCircle className="w-4 h-4" />
            <span>Credenciales sincronizadas en tu terminal. Iniciando noche...</span>
          </div>
        </div>
      </div>
    </div>
  );
};
