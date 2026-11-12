import React from 'react';
import { useSocket } from '../../context/SocketContext';
import {
  Gavel,
  ShieldCheck,
  Flame,
  AlertOctagon,
  Scale,
  Mic,
  EyeOff
} from 'lucide-react';

export const CourtroomView: React.FC = () => {
  const { gameState, nominateSuspect, castVerdict } = useSocket();

  if (!gameState) return null;

  const me = gameState.me;
  const isNominationPhase = gameState.phase === 'NOMINATION_AND_DEFENSE';
  const isVerdictPhase = gameState.phase === 'VERDICT_VOTE';

  const accused = gameState.nominatedPlayer;
  const isCloudOutage = gameState.activeTrend === 'CLOUD_OUTAGE';
  const isTwoFactor = gameState.activeTrend === 'TWO_FACTOR_REQUIRED';

  const alivePlayers = gameState.players.filter(p => p.isAlive);
  const myVote = me.id ? gameState.verdictTally?.voterDetails?.[me.id] : undefined;

  return (
    <div className="max-w-4xl w-full mx-auto px-4 py-6 space-y-6 animate-fade-in">
      {/* Banner de Tribunal */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center justify-between pb-4 border-b border-white/10 gap-3">
          <div className="flex items-center gap-2 text-orange-400">
            <Scale className="w-5 h-5" />
            <h2 className="text-sm font-mono font-bold tracking-widest uppercase">
              TRIBUNAL DIGITAL DIURNO // {isNominationPhase ? 'FASE DE NOMINACIÓN' : 'DELIBERACIÓN Y VEREDICTO'}
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
            <span>Reloj de Escrutinio:</span>
            <span className="px-2 py-0.5 rounded bg-zinc-900 border border-white/10 text-orange-400 font-bold">
              {gameState.phaseTimeRemaining}s
            </span>
          </div>
        </div>

        {/* ESTRADO DE ACUSADOS */}
        {accused ? (
          <div className="my-6 p-6 rounded-2xl bg-orange-950/20 border-2 border-orange-500/50 text-center relative overflow-hidden">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 font-mono text-xs mb-3 border border-orange-500/30">
              <Mic className="w-3.5 h-3.5 animate-pulse text-orange-400" />
              <span>SOSPECHOSO EN EL ESTRADO</span>
            </div>

            <h3 className="text-3xl font-extrabold text-white font-mono tracking-wider">
              {accused.nickname}
            </h3>
            <p className="text-xs text-zinc-400 mt-2 font-mono max-w-md mx-auto">
              El sospechoso dispone del canal de voz y chat destacado para argumentar su coartada.
            </p>

            {/* BOTONES DE VOTACIÓN DE VEREDICTO (FASE 4) */}
            {isVerdictPhase && me.isAlive && (
              <div className="mt-6 pt-6 border-t border-white/10">
                <div className="text-xs font-mono text-zinc-400 mb-4 uppercase tracking-wider">
                  Emite tu voto vinculante sobre el acusado:
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto">
                  {/* Culpable */}
                  <button
                    onClick={() => castVerdict('GUILTY')}
                    className="py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono font-bold text-xs tracking-wider border border-rose-400 shadow-lg shadow-rose-600/30 transition flex items-center justify-center gap-2"
                  >
                    <Gavel className="w-4 h-4" />
                    CULPABLE
                  </button>

                  {/* Inocente */}
                  <button
                    onClick={() => castVerdict('INNOCENT')}
                    className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs tracking-wider border border-emerald-400 shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    INOCENTE
                  </button>

                  {/* Abstención */}
                  <button
                    onClick={() => castVerdict('ABSTAIN')}
                    disabled={isTwoFactor}
                    title={isTwoFactor ? 'Bloqueado por 2FA Obligatorio' : 'Abstenerse de votar'}
                    className={`py-3 px-4 rounded-xl font-mono font-bold text-xs tracking-wider border transition flex items-center justify-center gap-2 ${
                      isTwoFactor
                        ? 'bg-zinc-800 text-zinc-600 border-zinc-700 cursor-not-allowed opacity-50'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-white/10'
                    }`}
                  >
                    <AlertOctagon className="w-4 h-4" />
                    ABSTENCIÓN
                  </button>
                </div>

                {isTwoFactor && (
                  <p className="text-[11px] font-mono text-amber-400 mt-2">
                    * Tendencia 2FA activa: La opción de abstención ha sido deshabilitada.
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          /* SI NADIE ESTÁ EN EL ESTRADO AÚN */
          <div className="my-6 p-8 rounded-2xl bg-zinc-900/50 border border-white/5 text-center">
            <Flame className="w-10 h-10 text-orange-400/60 mx-auto mb-2 animate-bounce" />
            <h3 className="text-base font-bold text-white font-mono">
              Fase de Nominación Activa
            </h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1">
              Acusen al agente con comportamiento sospechoso o discrepancias en los registros forenses.
            </p>
          </div>
        )}

        {/* LISTA DE CANDIDATOS A NOMINAR */}
        {isNominationPhase && me.isAlive && (
          <div className="space-y-3">
            <h4 className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
              Seleccionar Agente a Subir al Estrado:
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {alivePlayers.map((player) => {
                const votesCount = gameState.nominationsCount[player.id] || 0;
                const isNominatedByMe = me.id ? gameState.nominationsCount[player.id] > 0 : false;
                const isAccused = player.id === accused?.id;

                return (
                  <div
                    key={player.id}
                    className={`p-3.5 rounded-xl border flex items-center justify-between transition ${
                      isAccused
                        ? 'bg-orange-950/40 border-orange-500 shadow-md'
                        : 'bg-zinc-900/80 border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-bold text-white font-mono">
                        {player.nickname}
                      </div>
                      <div className="text-xs font-mono text-zinc-400 mt-0.5">
                        Acusaciones: <span className="text-orange-400 font-bold">{votesCount}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => nominateSuspect(player.id)}
                      disabled={player.id === me.id}
                      className="px-3 py-1.5 rounded-lg bg-orange-600/80 hover:bg-orange-500 text-white font-mono text-xs font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition"
                    >
                      ACUSAR
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* RECUENTO DE VEREDICTO EN TIEMPO REAL */}
        {gameState.verdictTally && (
          <div className="mt-6 p-4 rounded-xl bg-zinc-900/90 border border-white/5">
            <div className="flex items-center justify-between mb-3 text-xs font-mono">
              <span className="text-zinc-400 uppercase">Recuento de Votos:</span>
              {isCloudOutage && (
                <span className="flex items-center gap-1 text-cyan-400">
                  <EyeOff className="w-3.5 h-3.5" />
                  Cloud Outage: Votos 100% Anónimos
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/30">
                <div className="text-xs font-mono text-rose-300">CULPABLE</div>
                <div className="text-2xl font-black font-mono text-rose-400">
                  {gameState.verdictTally.guiltyCount}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30">
                <div className="text-xs font-mono text-emerald-300">INOCENTE</div>
                <div className="text-2xl font-black font-mono text-emerald-400">
                  {gameState.verdictTally.innocentCount}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-zinc-800/60 border border-white/10">
                <div className="text-xs font-mono text-zinc-400">ABSTENCIÓN</div>
                <div className="text-2xl font-black font-mono text-zinc-200">
                  {gameState.verdictTally.abstainCount}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
