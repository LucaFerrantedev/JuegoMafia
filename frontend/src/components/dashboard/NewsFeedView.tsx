import React from 'react';
import { useSocket } from '../../context/SocketContext';
import { DAILY_TRENDS, ROLES } from '@operacion-filtracion/shared';
import { Newspaper, Skull, AlertTriangle, Radio, ShieldCheck, Terminal } from 'lucide-react';

export const NewsFeedView: React.FC = () => {
  const { gameState, latestIntel } = useSocket();

  if (!gameState) return null;

  const bulletin = gameState.morningBulletin;
  const activeTrend = gameState.activeTrend ? DAILY_TRENDS[gameState.activeTrend] : null;

  return (
    <div className="max-w-3xl w-full mx-auto px-4 py-6 space-y-5 animate-fade-in">
      {/* Banner Principal del Boletín */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 relative overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2 text-cyan-400">
            <Newspaper className="w-5 h-5" />
            <h2 className="text-sm font-mono font-bold tracking-widest uppercase">
              BOLETÍN MATUTINO DIGITAL // RONDA {gameState.roundNumber}
            </h2>
          </div>
          <span className="text-xs font-mono text-zinc-400">
            Transmisión en vivo
          </span>
        </div>

        {/* Víctimas de la noche */}
        <div className="space-y-3 mb-6">
          <h3 className="text-xs font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-2">
            <Skull className="w-4 h-4 text-rose-400" />
            <span>Registro Forense de Incidentes:</span>
          </h3>

          {bulletin?.victims && bulletin.victims.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {bulletin.victims.map((v) => (
                <div
                  key={v.playerId}
                  className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/30 flex items-center justify-between"
                >
                  <div>
                    <div className="text-base font-bold text-white font-mono">
                      {v.nickname}
                    </div>
                    <div className="text-xs text-rose-300 font-mono">
                      Rol confirmado: {v.revealedRole ? ROLES[v.revealedRole].name : 'Desconocido'}
                    </div>
                  </div>
                  <span className="text-xs font-mono px-2 py-1 rounded bg-rose-900/60 text-rose-200 border border-rose-500/40">
                    SILENCIADO
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 text-xs font-mono flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Noche sin bajas. Los sistemas de defensa y contramedidas funcionaron.</span>
            </div>
          )}
        </div>

        {/* Pistas forenses */}
        {bulletin?.forensicNotes && bulletin.forensicNotes.length > 0 && (
          <div className="mb-6 p-3.5 rounded-xl bg-zinc-900/80 border border-white/5 space-y-1">
            <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
              // Notas de los peritos en ciberseguridad:
            </div>
            {bulletin.forensicNotes.map((note, idx) => (
              <p key={idx} className="text-xs text-zinc-300 font-mono">
                • {note}
              </p>
            ))}
          </div>
        )}

        {/* Tendencia del Día (Evento Global) */}
        {activeTrend && (
          <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/40 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-bold uppercase tracking-wider">
              <Radio className="w-4 h-4 animate-pulse" />
              <span>TENDENCIA GLOBAL ACTIVA: {activeTrend.title}</span>
            </div>
            <p className="text-xs text-amber-200/90 leading-relaxed font-sans">
              {activeTrend.description}
            </p>
          </div>
        )}

        {/* Filtración de Mensaje de Mafia (Data Leak) */}
        {bulletin?.leakedMafiaMessage && (
          <div className="mt-4 p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/40 space-y-1.5">
            <div className="flex items-center gap-2 text-cyan-300 font-mono text-xs font-bold">
              <Terminal className="w-4 h-4" />
              <span>PAQUETE DE RED INTERCEPTADO (LEAK):</span>
            </div>
            <p className="text-xs text-zinc-200 font-mono italic bg-zinc-900/80 p-2.5 rounded border border-white/5">
              "{bulletin.leakedMafiaMessage}"
            </p>
            <span className="text-[10px] text-zinc-400 font-mono">
              * Origen: Canal encriptado del Cártel. Autor anonimizado.
            </span>
          </div>
        )}
      </div>

      {/* Reporte Privado de Inteligencia (si el jugador es OSINT, Periodista o Smart-Cam) */}
      {latestIntel && (
        <div className="glass-panel p-5 rounded-2xl border border-cyan-500/40 bg-cyan-950/20 shadow-[0_0_20px_rgba(0,255,200,0.08)]">
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold uppercase tracking-wider mb-2">
            <AlertTriangle className="w-4 h-4" />
            <span>{latestIntel.title}</span>
          </div>
          <p className="text-xs text-zinc-200 font-mono leading-relaxed bg-zinc-900/90 p-3 rounded-xl border border-white/5">
            {latestIntel.content}
          </p>
        </div>
      )}
    </div>
  );
};
