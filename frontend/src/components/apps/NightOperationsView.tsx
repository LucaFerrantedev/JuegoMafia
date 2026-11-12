import React, { useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import {
  ROLES,
  RoleId,
  NightActionType
} from '@operacion-filtracion/shared';
import {
  Shield,
  Crosshair,
  Skull,
  Radio,
  Terminal,
  Camera,
  HeartPulse,
  Fingerprint,
  CheckCircle,
  Activity,
  Flame,
  Search
} from 'lucide-react';

export const NightOperationsView: React.FC = () => {
  const { gameState, submitNightAction } = useSocket();

  const [selectedTargetId, setSelectedTargetId] = useState<string>('');
  const [selectedSecondaryId, setSelectedSecondaryId] = useState<string>('');
  const [ddosMode, setDdosMode] = useState<'CANCEL_NIGHT' | 'SILENCE_DAY'>('CANCEL_NIGHT');
  const [fakeRole, setFakeRole] = useState<RoleId>('SMART_CAM_CITIZEN');
  const [deepfakeMode, setDeepfakeMode] = useState<'FRAME_GPS' | 'ALTER_OBITUARY'>('FRAME_GPS');
  const [minigamePing, setMinigamePing] = useState<number>(32);

  if (!gameState || gameState.phase !== 'NIGHT_OPERATIONS') return null;

  const me = gameState.me;
  const roleDef = ROLES[me.role];
  const alivePlayers = gameState.players.filter(p => p.isAlive);
  const otherAlivePlayers = alivePlayers.filter(p => p.id !== me.id);
  const myCurrentAction = me.myNightAction;

  // Handler para enviar la acción
  const handleExecute = (actionType: NightActionType) => {
    submitNightAction({
      type: actionType,
      targetId: selectedTargetId || undefined,
      secondaryTargetId: selectedSecondaryId || undefined,
      meta: {
        ddosMode,
        fakeRoleId: deepfakeMode === 'ALTER_OBITUARY' ? fakeRole : undefined
      }
    });
  };

  return (
    <div className="max-w-4xl w-full mx-auto px-4 py-6 space-y-6 animate-fade-in">
      {/* Marco de Terminal Móvil / Smartphone 2026 */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden scanline">
        {/* Glow Superior */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2 text-cyan-400">
            <Activity className="w-5 h-5 animate-pulse" />
            <span className="text-xs font-mono font-bold tracking-widest uppercase">
              NEO-APP // {roleDef.appTitle || 'SUITE DE OPERACIONES'}
            </span>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs text-zinc-400">
            <span>Cierre de ventana nocturna:</span>
            <span className="text-cyan-300 font-bold bg-zinc-900 px-2 py-0.5 rounded border border-white/5">
              {gameState.phaseTimeRemaining}s
            </span>
          </div>
        </div>

        {/* Notificación de Confirmación de Acción */}
        {myCurrentAction && (
          <div className="mt-4 p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Orden encolada y programada con éxito para el amanecer.</span>
            </div>
            <span className="text-[10px] text-zinc-400 uppercase">
              Tipo: {myCurrentAction.type}
            </span>
          </div>
        )}

        {/* ========================================================
            APP ESPECÍFICA SEGÚN ROL
        ======================================================== */}
        <div className="py-6">
          {/* 1. EL CEO / CAPO (ELIMINACIÓN DE LA MAFIA) */}
          {me.role === 'CEO' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-rose-400 font-mono text-sm font-bold">
                <Skull className="w-5 h-5" />
                <span>TERMINAL DE ELIMINACIÓN CORPORATIVA</span>
              </div>
              <p className="text-xs text-zinc-300">
                Selecciona al objetivo que el Cártel silenciará esta madrugada.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {otherAlivePlayers.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedTargetId(p.id)}
                    className={`p-3.5 rounded-xl font-mono text-left border transition ${
                      selectedTargetId === p.id
                        ? 'bg-rose-950/60 border-rose-500 text-white shadow-lg shadow-rose-900/30'
                        : 'bg-zinc-900/80 border-white/5 text-zinc-300 hover:border-white/20'
                    }`}
                  >
                    <div className="font-bold text-sm">{p.nickname}</div>
                    <div className="text-[11px] text-zinc-500 mt-1">Marcar objetivo</div>
                  </button>
                ))}
              </div>

              <button
                onClick={() => handleExecute('CARTEL_KILL')}
                disabled={!selectedTargetId}
                className="w-full py-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono font-bold text-xs tracking-wider disabled:opacity-40 disabled:cursor-not-allowed transition shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2"
              >
                <Skull className="w-4 h-4" />
                CONFIRMAR ORDEN DE SILENCIAMIENTO
              </button>
            </div>
          )}

          {/* 2. HACKER DE SOMBRERO NEGRO (DDOS) */}
          {me.role === 'BLACK_HAT_HACKER' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-cyan-400 font-mono text-sm font-bold">
                <Terminal className="w-5 h-5" />
                <span>BOTNET ZERO-DAY // ATAQUE DDOS</span>
              </div>

              {/* Selector de modo DDoS */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setDdosMode('CANCEL_NIGHT')}
                  className={`p-3 rounded-xl border font-mono text-xs text-left ${
                    ddosMode === 'CANCEL_NIGHT'
                      ? 'bg-cyan-950/60 border-cyan-400 text-cyan-200'
                      : 'bg-zinc-900 border-white/5 text-zinc-400'
                  }`}
                >
                  <div className="font-bold">Bloqueo Nocturno</div>
                  <div className="text-[10px] text-zinc-500 mt-1">Cancela la habilidad que use esta noche</div>
                </button>
                <button
                  onClick={() => setDdosMode('SILENCE_DAY')}
                  className={`p-3 rounded-xl border font-mono text-xs text-left ${
                    ddosMode === 'SILENCE_DAY'
                      ? 'bg-cyan-950/60 border-cyan-400 text-cyan-200'
                      : 'bg-zinc-900 border-white/5 text-zinc-400'
                  }`}
                >
                  <div className="font-bold">Silenciar Debate Diurno</div>
                  <div className="text-[10px] text-zinc-500 mt-1">Le hackea el chat general para el día de mañana</div>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {otherAlivePlayers.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedTargetId(p.id)}
                    className={`p-3.5 rounded-xl font-mono text-left border transition ${
                      selectedTargetId === p.id
                        ? 'bg-cyan-950/60 border-cyan-400 text-white'
                        : 'bg-zinc-900/80 border-white/5 text-zinc-300'
                    }`}
                  >
                    <div className="font-bold text-sm">{p.nickname}</div>
                    <div className="text-[11px] text-zinc-500 mt-1">Inyectar exploit</div>
                  </button>
                ))}
              </div>

              <button
                onClick={() => handleExecute('HACKER_DDOS')}
                disabled={!selectedTargetId}
                className="w-full py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-mono font-bold text-xs tracking-wider disabled:opacity-40 transition"
              >
                DESPLEGAR ATAQUE DDOS
              </button>
            </div>
          )}

          {/* 3. ESPECIALISTA EN DEEPFAKES */}
          {me.role === 'DEEPFAKE_SPECIALIST' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-purple-400 font-mono text-sm font-bold">
                  <Fingerprint className="w-5 h-5" />
                  <span>SYNTHETIX DEEPFAKE STUDIO</span>
                </div>
                <span className="text-xs font-mono text-purple-300 bg-purple-950/50 px-2 py-0.5 rounded border border-purple-500/30">
                  Usos restantes: {me.remainingAbilityUses}/1
                </span>
              </div>

              {me.remainingAbilityUses <= 0 ? (
                <div className="p-4 rounded-xl bg-zinc-900 border border-white/5 text-zinc-500 text-xs font-mono text-center">
                  Has agotado tu uso único de alteración biométrica por esta partida.
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setDeepfakeMode('FRAME_GPS')}
                      className={`p-3 rounded-xl border font-mono text-xs text-left ${
                        deepfakeMode === 'FRAME_GPS'
                          ? 'bg-purple-950/60 border-purple-400 text-purple-200'
                          : 'bg-zinc-900 border-white/5 text-zinc-400'
                      }`}
                    >
                      <div className="font-bold">Inculpar Rastreo GPS</div>
                      <div className="text-[10px] text-zinc-500 mt-1">Hace que el OSINT lo detecte cerca de la víctima</div>
                    </button>
                    <button
                      onClick={() => setDeepfakeMode('ALTER_OBITUARY')}
                      className={`p-3 rounded-xl border font-mono text-xs text-left ${
                        deepfakeMode === 'ALTER_OBITUARY'
                          ? 'bg-purple-950/60 border-purple-400 text-purple-200'
                          : 'bg-zinc-900 border-white/5 text-zinc-400'
                      }`}
                    >
                      <div className="font-bold">Falsificar Obituario</div>
                      <div className="text-[10px] text-zinc-500 mt-1">Altera el rol que se anunciará al morir</div>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {otherAlivePlayers.map(p => (
                      <button
                        key={p.id}
                        onClick={() => setSelectedTargetId(p.id)}
                        className={`p-3.5 rounded-xl font-mono text-left border transition ${
                          selectedTargetId === p.id
                            ? 'bg-purple-950/60 border-purple-400 text-white'
                            : 'bg-zinc-900/80 border-white/5 text-zinc-300'
                        }`}
                      >
                        <div className="font-bold text-sm">{p.nickname}</div>
                        <div className="text-[11px] text-zinc-500 mt-1">Seleccionar identidad</div>
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => handleExecute('DEEPFAKE_FRAME')}
                    disabled={!selectedTargetId}
                    className="w-full py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-mono font-bold text-xs tracking-wider disabled:opacity-40 transition"
                  >
                    GENERAR SÍNTESIS DEEPFAKE
                  </button>
                </>
              )}
            </div>
          )}

          {/* 4. PARAMÉDICO / MÉDICO DE EMERGENCIAS */}
          {me.role === 'PARAMEDIC' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-emerald-400 font-mono text-sm font-bold">
                <HeartPulse className="w-5 h-5" />
                <span>DESPACHO MÉDICO DE EMERGENCIA</span>
              </div>
              <p className="text-xs text-zinc-300">
                Envía una patrulla y equipo médico para blindar a un jugador contra un atentado. (No puedes repetir la misma persona dos noches seguidas).
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {alivePlayers.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedTargetId(p.id)}
                    className={`p-3.5 rounded-xl font-mono text-left border transition ${
                      selectedTargetId === p.id
                        ? 'bg-emerald-950/60 border-emerald-400 text-white'
                        : 'bg-zinc-900/80 border-white/5 text-zinc-300'
                    }`}
                  >
                    <div className="font-bold text-sm">
                      {p.nickname} {p.id === me.id && '(Tú)'}
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-1">Proteger domicilio</div>
                  </button>
                ))}
              </div>

              <button
                onClick={() => handleExecute('PARAMEDIC_HEAL')}
                disabled={!selectedTargetId}
                className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-mono font-bold text-xs tracking-wider disabled:opacity-40 transition"
              >
                DESPACHAR BLINDAJE MÉDICO
              </button>
            </div>
          )}

          {/* 5. ANALISTA OSINT */}
          {me.role === 'OSINT_ANALYST' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-cyan-400 font-mono text-sm font-bold">
                <Search className="w-5 h-5" />
                <span>RASTREADOR DE METADATOS Y ANTENAS OSINT</span>
              </div>
              <p className="text-xs text-zinc-300">
                Interviene la huella de telecomunicaciones de un sospechoso para comprobar si se desplazó durante la noche.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {otherAlivePlayers.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedTargetId(p.id)}
                    className={`p-3.5 rounded-xl font-mono text-left border transition ${
                      selectedTargetId === p.id
                        ? 'bg-cyan-950/60 border-cyan-400 text-white'
                        : 'bg-zinc-900/80 border-white/5 text-zinc-300'
                    }`}
                  >
                    <div className="font-bold text-sm">{p.nickname}</div>
                    <div className="text-[11px] text-zinc-500 mt-1">Rastrear antenas celulares</div>
                  </button>
                ))}
              </div>

              <button
                onClick={() => handleExecute('OSINT_INVESTIGATE')}
                disabled={!selectedTargetId}
                className="w-full py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-mono font-bold text-xs tracking-wider disabled:opacity-40 transition"
              >
                EJECUTAR RASTREO FORENSE
              </button>
            </div>
          )}

          {/* 6. PERIODISTA DE INVESTIGACIÓN (WHISTLEBLOWER) */}
          {me.role === 'JOURNALIST' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-cyan-400 font-mono text-sm font-bold">
                <Radio className="w-5 h-5" />
                <span>CRUCE DE BASES DE DATOS CONFIDENCIALES</span>
              </div>
              <p className="text-xs text-zinc-300">
                Selecciona 2 agentes para comprobar si operan en la misma red (mismo bando) o en redes rivales.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono text-zinc-400 mb-2 block">Sujeto A:</label>
                  <select
                    value={selectedTargetId}
                    onChange={(e) => setSelectedTargetId(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/10 p-2.5 rounded-xl text-sm font-mono text-white"
                  >
                    <option value="">Elegir agente 1...</option>
                    {alivePlayers.map(p => (
                      <option key={p.id} value={p.id}>{p.nickname}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-mono text-zinc-400 mb-2 block">Sujeto B:</label>
                  <select
                    value={selectedSecondaryId}
                    onChange={(e) => setSelectedSecondaryId(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/10 p-2.5 rounded-xl text-sm font-mono text-white"
                  >
                    <option value="">Elegir agente 2...</option>
                    {alivePlayers.filter(p => p.id !== selectedTargetId).map(p => (
                      <option key={p.id} value={p.id}>{p.nickname}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={() => handleExecute('JOURNALIST_COMPARE')}
                disabled={!selectedTargetId || !selectedSecondaryId}
                className="w-full py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-mono font-bold text-xs tracking-wider disabled:opacity-40 transition"
              >
                CRUZAR REGISTROS DE RED
              </button>
            </div>
          )}

          {/* 7. VECINO CON SMART-CAM */}
          {me.role === 'SMART_CAM_CITIZEN' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-cyan-400 font-mono text-sm font-bold">
                  <Camera className="w-5 h-5" />
                  <span>DOORBELL GUARD PRO // CÁMARA INTELIGENTE</span>
                </div>
                <span className="text-xs font-mono text-cyan-300 bg-cyan-950/60 px-2.5 py-1 rounded border border-cyan-500/30">
                  Batería: {me.remainingAbilityUses}/2 usos
                </span>
              </div>
              <p className="text-xs text-zinc-300">
                Arma los sensores de tu cámara de entrada. Si alguien visita tu domicilio esta noche, recibirás un reporte de sospechosos al amanecer.
              </p>

              {me.remainingAbilityUses > 0 ? (
                <button
                  onClick={() => handleExecute('SMART_CAM_ACTIVATE')}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-zinc-950 font-mono font-bold text-xs tracking-wider transition shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  ACTIVAR VIGILANCIA PERIMETRAL NOCTURNA
                </button>
              ) : (
                <div className="p-4 rounded-xl bg-zinc-900 border border-white/5 text-zinc-500 text-xs font-mono text-center">
                  Batería agotada. Has consumido los 2 usos disponibles.
                </div>
              )}
            </div>
          )}

          {/* 8. EL TROLL / RAGEBAITER */}
          {me.role === 'TROLL' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-purple-400 font-mono text-sm font-bold">
                <Flame className="w-5 h-5" />
                <span>FLAMEWAR VIRAL HUB</span>
              </div>
              <p className="text-xs text-zinc-300">
                Tu objetivo de victoria es provocar al pueblo para que te declaren CULPABLE en el juicio diurno. Si te eliminan por votación, ganas la partida automáticamente.
              </p>
              <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 text-xs font-mono text-purple-300 space-y-2">
                <div className="font-bold">// Radar de Indignación Pública: 92%</div>
                <p className="text-zinc-400">
                  Planifica tu coartada engañosa o contradicciones ficticias para llamar la atención en el chat diurno.
                </p>
              </div>
            </div>
          )}

          {/* 9. EL MERCENARIO FREELANCE (HITMAN) */}
          {me.role === 'HITMAN' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-purple-400 font-mono text-sm font-bold">
                <Crosshair className="w-5 h-5" />
                <span>DARKPOOL BOUNTY CONTRACT</span>
              </div>
              <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/40 space-y-2">
                <div className="text-xs font-mono text-zinc-400 uppercase">Objetivo Activo:</div>
                <div className="text-2xl font-black font-mono text-white">
                  {me.hitmanTargetNickname || 'Objetivo Confidencial'}
                </div>
                <p className="text-xs text-zinc-300">
                  Si este ciudadano es eliminado (sea por el Cártel de noche o en el estrado de día) mientras tú sigues con vida, ganas la partida.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
