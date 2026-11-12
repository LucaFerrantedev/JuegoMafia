import React, { useState, useRef, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import {
  Send,
  Lock,
  MessageSquare,
  Skull,
  ShieldAlert,
  BellRing,
  Globe,
  Radio,
  UserCheck
} from 'lucide-react';

export const MessengerView: React.FC = () => {
  const {
    gameState,
    chatMessages,
    directMessages,
    systemAlerts,
    sendChatMessage,
    sendDirectMessage
  } = useSocket();

  const [activeTab, setActiveTab] = useState<'PUBLIC' | 'MAFIA' | 'SPECTATOR' | 'DMS'>('PUBLIC');
  const [inputText, setInputText] = useState('');
  const [dmTargetId, setDmTargetId] = useState('');
  const chatScrollRef = useRef<HTMLDivElement>(null);

  if (!gameState) return null;

  const me = gameState.me;
  const isNight = gameState.phase === 'NIGHT_OPERATIONS';
  const isMafia = me.faction === 'CARTEL';
  const isDead = !me.isAlive;
  const isSilenced = me.isSilenced;

  // Auto-scroll al recibir mensajes
  useEffect(() => {
    chatScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, directMessages, systemAlerts, activeTab]);

  // Si es de noche y es mafia, sugerir canal de mafia
  useEffect(() => {
    if (isNight && isMafia) {
      setActiveTab('MAFIA');
    } else if (isNight && !isMafia) {
      setActiveTab('PUBLIC');
    }
  }, [isNight, isMafia]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed) return;

    if (activeTab === 'DMS') {
      if (!dmTargetId) return;
      sendDirectMessage(dmTargetId, trimmed);
      setInputText('');
    } else {
      sendChatMessage(activeTab, trimmed);
      setInputText('');
    }
  };

  // Filtrar mensajes según pestaña activa
  const visibleMessages = chatMessages.filter(m => m.channel === activeTab);
  const otherAlivePlayers = gameState.players.filter(p => p.id !== me.id && p.isAlive);

  return (
    <div className="flex flex-col h-[650px] max-w-4xl w-full mx-auto glass-panel rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
      {/* Selector de Canales Estilo Signal/Telegram */}
      <div className="bg-zinc-900/90 border-b border-white/10 px-4 py-3 flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-2">
          {/* Canal Público */}
          <button
            onClick={() => setActiveTab('PUBLIC')}
            className={`px-3 py-1.5 rounded-xl font-mono text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === 'PUBLIC'
                ? 'bg-cyan-500 text-zinc-950 shadow-md shadow-cyan-500/20'
                : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Red Abierta</span>
          </button>

          {/* Canal Mafia (Solo para miembros del Cártel) */}
          {isMafia && (
            <button
              onClick={() => setActiveTab('MAFIA')}
              className={`px-3 py-1.5 rounded-xl font-mono text-xs font-semibold flex items-center gap-2 transition ${
                activeTab === 'MAFIA'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'bg-rose-950/40 text-rose-300 hover:bg-rose-950 border border-rose-500/20'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Cártel Privado</span>
            </button>
          )}

          {/* Canal de DMs */}
          {me.isAlive && !isNight && (
            <button
              onClick={() => setActiveTab('DMS')}
              className={`px-3 py-1.5 rounded-xl font-mono text-xs font-semibold flex items-center gap-2 transition ${
                activeTab === 'DMS'
                  ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>DMs Cifrados</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/40 text-amber-200">
                {me.dmsRemainingToday}/2
              </span>
            </button>
          )}

          {/* Canal de Espectadores */}
          {(isDead || gameState.phase === 'GAME_OVER') && (
            <button
              onClick={() => setActiveTab('SPECTATOR')}
              className={`px-3 py-1.5 rounded-xl font-mono text-xs font-semibold flex items-center gap-2 transition ${
                activeTab === 'SPECTATOR'
                  ? 'bg-zinc-700 text-white'
                  : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Skull className="w-3.5 h-3.5" />
              <span>Frecuencia Espectadores</span>
            </button>
          )}
        </div>

        {/* Indicador de estado */}
        <div className="text-[11px] font-mono text-zinc-500 hidden sm:flex items-center gap-1.5">
          <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
          <span>CANAL ENCRIPTADO</span>
        </div>
      </div>

      {/* Alertas del Sistema y Trazabilidad de DMs */}
      {systemAlerts.length > 0 && (
        <div className="bg-zinc-950/60 border-b border-white/5 px-4 py-2 flex items-center gap-2 overflow-x-auto text-xs font-mono text-amber-400/90 whitespace-nowrap">
          <BellRing className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="truncate">{systemAlerts[systemAlerts.length - 1].text}</span>
        </div>
      )}

      {/* Área de Mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 font-sans text-sm">
        {activeTab !== 'DMS' ? (
          visibleMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-500 text-xs font-mono gap-2">
              <MessageSquare className="w-8 h-8 stroke-[1.5]" />
              <span>No hay transmisiones en este canal aún.</span>
            </div>
          ) : (
            visibleMessages.map((m) => {
              const isMe = m.senderId === me.id;
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 mb-1">
                    <span className="font-semibold text-zinc-300">{m.senderNickname}</span>
                    <span className="text-[10px] text-zinc-600">
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  <div
                    className={`max-w-md px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isMe
                        ? 'bg-cyan-500 text-zinc-950 font-medium rounded-br-sm shadow-md'
                        : activeTab === 'MAFIA'
                        ? 'bg-rose-950/70 border border-rose-500/30 text-rose-100 rounded-bl-sm'
                        : 'bg-zinc-800/90 border border-white/5 text-zinc-100 rounded-bl-sm'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              );
            })
          )
        ) : (
          /* Renderizado de DMs */
          directMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-500 text-xs font-mono gap-2 text-center p-6">
              <Lock className="w-8 h-8 text-amber-500/50" />
              <p>Dispones de 2 Mensajes Directos (DMs) por día.</p>
              <p className="text-[11px] text-zinc-600">
                Al enviar un DM, el chat público anunciará la alerta para evitar colusiones invisibles.
              </p>
            </div>
          ) : (
            directMessages.map((dm) => {
              const isSentByMe = dm.senderId === me.id;
              return (
                <div
                  key={dm.id}
                  className={`flex flex-col ${isSentByMe ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-amber-400/80 mb-1">
                    <span>
                      {isSentByMe ? `Para: ${dm.recipientNickname}` : `De: ${dm.senderNickname}`}
                    </span>
                  </div>
                  <div className="max-w-md px-4 py-2.5 rounded-2xl text-sm bg-amber-950/40 border border-amber-500/30 text-amber-100">
                    {dm.text}
                  </div>
                </div>
              );
            })
          )
        )}
        <div ref={chatScrollRef} />
      </div>

      {/* Input y Controles de Envío */}
      <div className="bg-zinc-900/95 border-t border-white/10 p-3">
        {/* Aviso de Silencio por DDoS */}
        {isSilenced && activeTab === 'PUBLIC' ? (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Terminal bajo ataque DDoS. El micrófono y teclado han sido bloqueados para este ciclo diurno.</span>
          </div>
        ) : isNight && activeTab === 'PUBLIC' ? (
          <div className="p-3 rounded-xl bg-zinc-800/60 text-zinc-400 text-xs font-mono text-center">
            🌙 El chat general permanece desconectado durante la noche.
          </div>
        ) : (
          <form onSubmit={handleSend} className="space-y-2">
            {/* Si estamos en pestaña DMs, selector de destinatario */}
            {activeTab === 'DMS' && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-amber-400 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5" /> Enviar a:
                </span>
                <select
                  value={dmTargetId}
                  onChange={(e) => setDmTargetId(e.target.value)}
                  className="bg-zinc-800 border border-white/10 rounded-lg text-xs font-mono text-white px-3 py-1.5 focus:outline-none focus:border-amber-400"
                >
                  <option value="">Seleccionar agente...</option>
                  {otherAlivePlayers.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nickname}
                    </option>
                  ))}
                </select>
                <span className="text-[11px] font-mono text-zinc-500 ml-auto">
                  DMs restantes hoy: {me.dmsRemainingToday}/2
                </span>
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                maxLength={240}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  activeTab === 'DMS'
                    ? 'Mensaje directo corto...'
                    : activeTab === 'MAFIA'
                    ? 'Transmisión confidencial del Cártel...'
                    : 'Escribir mensaje encriptado...'
                }
                disabled={activeTab === 'DMS' && (me.dmsRemainingToday <= 0 || !dmTargetId)}
                className="flex-1 px-4 py-2.5 bg-zinc-950/80 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400 text-sm font-sans transition disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={
                  !inputText.trim() ||
                  (activeTab === 'DMS' && (me.dmsRemainingToday <= 0 || !dmTargetId))
                }
                className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold rounded-xl text-sm font-mono transition flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-cyan-500/20"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">ENVIAR</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
