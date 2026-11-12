import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useSocket } from '../../context/SocketContext';
import { ROLES, Faction } from '@operacion-filtracion/shared';
import { Trophy, Skull, Shield, Crosshair, Flame, RotateCcw } from 'lucide-react';

export const GameOverModal: React.FC = () => {
  const { gameState } = useSocket();

  useEffect(() => {
    if (gameState?.phase === 'GAME_OVER') {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [gameState?.phase]);

  if (!gameState || gameState.phase !== 'GAME_OVER') return null;

  const winner = gameState.winner;
  const me = gameState.me;
  const players = gameState.players;

  const isCartelWin = winner === 'CARTEL';
  const isCitizenWin = winner === 'CITIZEN';
  const isTrollWin = winner === 'TROLL_SOLO';
  const isHitmanWin = winner === 'HITMAN_SOLO';

  let title = 'PARTIDA CONCLUIDA';
  let subtitle = 'Todas las operaciones han cesado.';
  let badgeColor = 'text-cyan-400 bg-cyan-950/60 border-cyan-500/40';

  if (isCartelWin) {
    title = 'VICTORIA DEL CÁRTEL CORPORATIVO';
    subtitle = 'El sindicato ha igualado en número a la resistencia y domina el ecosistema.';
    badgeColor = 'text-rose-400 bg-rose-950/60 border-rose-500/40';
  } else if (isCitizenWin) {
    title = 'VICTORIA DE LOS CIUDADANOS';
    subtitle = 'Todos los miembros del Cártel han sido identificados y neutralizados.';
    badgeColor = 'text-emerald-400 bg-emerald-950/60 border-emerald-500/40';
  } else if (isTrollWin) {
    title = 'VICTORIA DEL TROLL / RAGEBAITER';
    subtitle = 'Logró ser cancelado en el juicio público, desestabilizando toda la red.';
    badgeColor = 'text-purple-400 bg-purple-950/60 border-purple-500/40';
  } else if (isHitmanWin) {
    title = 'VICTORIA DEL MERCENARIO FREELANCE';
    subtitle = 'El contrato en criptomonedas ha sido cumplido con éxito.';
    badgeColor = 'text-purple-400 bg-purple-950/60 border-purple-500/40';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg animate-fade-in overflow-y-auto">
      <div className="max-w-2xl w-full glass-panel rounded-3xl border border-white/10 p-6 md:p-8 shadow-2xl relative my-8">
        <div className="text-center space-y-3 pb-6 border-b border-white/10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-zinc-900 border border-white/10 shadow-inner mb-2">
            <Trophy className="w-8 h-8 text-amber-400" />
          </div>
          <div className={`inline-block px-3 py-1 rounded-full text-xs font-mono font-bold border ${badgeColor}`}>
            {title}
          </div>
          <p className="text-xs text-zinc-400 max-w-md mx-auto font-mono">
            {subtitle}
          </p>
        </div>

        {/* TABLA DE DESCLASIFICACIÓN DE ROLES (FULL ROSTER REVEAL) */}
        <div className="py-6 space-y-4">
          <h3 className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
            // Desclasificación Total de Agentes y Facciones:
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
            {players.map((p) => {
              const roleDef = p.revealedRole ? ROLES[p.revealedRole] : null;
              const isMe = p.id === me.id;

              return (
                <div
                  key={p.id}
                  className={`p-3.5 rounded-xl border flex items-center justify-between font-mono text-xs ${
                    isMe
                      ? 'bg-cyan-950/30 border-cyan-500/40'
                      : 'bg-zinc-900/70 border-white/5'
                  }`}
                >
                  <div>
                    <div className="font-bold text-white flex items-center gap-1.5">
                      {p.nickname}
                      {isMe && <span className="text-[10px] text-cyan-400">(Tú)</span>}
                      {!p.isAlive && <span className="text-[10px] text-rose-500">[ELIMINADO]</span>}
                    </div>
                    <div className="text-zinc-400 mt-1">
                      {roleDef ? roleDef.name : 'Rol no revelado'}
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      p.revealedFaction === 'CARTEL'
                        ? 'bg-rose-950 text-rose-300 border border-rose-500/30'
                        : p.revealedFaction === 'CITIZEN'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                        : 'bg-purple-950 text-purple-300 border border-purple-500/30'
                    }`}
                  >
                    {p.revealedFaction || 'NEUTRAL'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Botón de recarga */}
        <div className="pt-4 border-t border-white/10 flex justify-center">
          <button
            onClick={() => window.location.reload()}
            className="py-3 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-zinc-950 font-mono font-bold text-xs tracking-wider transition shadow-lg shadow-cyan-500/20 flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            VOLVER AL MENÚ PRINCIPAL
          </button>
        </div>
      </div>
    </div>
  );
};
