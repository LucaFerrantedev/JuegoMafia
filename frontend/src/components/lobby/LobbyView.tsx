import React, { useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import { Users, Copy, Check, Play, ShieldAlert, Cpu, Sparkles } from 'lucide-react';

export const LobbyView: React.FC = () => {
  const { gameState, createRoom, joinRoom, toggleReady, startGame } = useSocket();
  const [nickname, setNickname] = useState('');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [copied, setCopied] = useState(false);

  // Vista cuando el usuario todavía no se unió a ninguna sala
  if (!gameState) {
    return (
      <div className="max-w-md w-full mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 mb-4 shadow-[0_0_25px_rgba(0,255,200,0.15)]">
            <Cpu className="w-8 h-8 text-cyan-300 animate-pulse" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2 font-mono">
            OPERACIÓN FILTRACIÓN
          </h1>
          <p className="text-zinc-400 text-sm">
            Deducción social, vigilancia digital y espionaje corporativo (Edición 2026)
          </p>
        </div>

        <div className="glass-panel p-6 rounded-2xl shadow-2xl border border-white/10 space-y-5">
          <div>
            <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider mb-2">
              Alias de Agente
            </label>
            <input
              type="text"
              maxLength={16}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Ej. Cipher_26, GhostByte"
              className="w-full px-4 py-3 bg-zinc-900/90 border border-white/10 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-mono text-sm transition"
            />
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <button
              onClick={() => {
                if (!nickname.trim()) return;
                createRoom(nickname.trim());
              }}
              disabled={!nickname.trim()}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-zinc-950 font-bold text-sm tracking-wide shadow-lg shadow-cyan-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              CREAR SALA NUEVA
            </button>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-zinc-800"></div>
              <span className="flex-shrink mx-4 text-zinc-600 text-xs font-mono">O UNIRSE CON CÓDIGO</span>
              <div className="flex-grow border-t border-zinc-800"></div>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                maxLength={4}
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                placeholder="CÓDIGO (EJ. X8A2)"
                className="w-1/2 px-4 py-3 bg-zinc-900/90 border border-white/10 rounded-xl text-white uppercase placeholder-zinc-600 font-mono text-center tracking-widest text-sm focus:outline-none focus:border-cyan-400"
              />
              <button
                onClick={() => {
                  if (!nickname.trim() || roomCodeInput.length !== 4) return;
                  joinRoom(roomCodeInput.trim(), nickname.trim());
                }}
                disabled={!nickname.trim() || roomCodeInput.length !== 4}
                className="w-1/2 py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-sm border border-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                UNIRSE
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-zinc-500 font-mono flex items-center justify-center gap-1.5">
          <ShieldAlert className="w-4 h-4 text-zinc-600" />
          Servidor autoritativo con cifrado de estado Anti-Cheat
        </div>
      </div>
    );
  }

  // Vista dentro de la sala de espera
  const players = gameState.players;
  const me = gameState.me;
  const isHost = me.isHost;
  const canStart = players.length >= 4;

  const copyRoomCode = () => {
    navigator.clipboard.writeText(gameState.roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-2xl w-full mx-auto px-4 py-6">
      {/* Header de Sala */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">SALA SEGURA</span>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-3xl font-extrabold font-mono tracking-widest text-cyan-400">
              {gameState.roomCode}
            </span>
            <button
              onClick={copyRoomCode}
              className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition border border-white/5"
              title="Copiar código"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-zinc-400 mt-1">Comparte este código con tus amigos para jugar juntos</p>
        </div>

        <div className="flex items-center gap-2 bg-zinc-900/80 px-4 py-2.5 rounded-xl border border-white/5">
          <Users className="w-4 h-4 text-cyan-400" />
          <span className="font-mono text-sm text-zinc-200">
            {players.length} / 14 Agentes
          </span>
        </div>
      </div>

      {/* Lista de Agentes en Sala */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 mb-6">
        <h3 className="text-xs font-mono text-zinc-400 uppercase tracking-wider mb-4 flex items-center justify-between">
          <span>Agentes en Terminal ({players.length})</span>
          {!canStart && <span className="text-amber-400 font-mono text-[11px]">Mínimo 4 jugadores requeridos</span>}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {players.map((p) => {
            const isMe = p.id === me.id;
            return (
              <div
                key={p.id}
                className={`p-3.5 rounded-xl flex items-center justify-between border transition ${
                  isMe
                    ? 'bg-cyan-950/30 border-cyan-500/40'
                    : 'bg-zinc-900/60 border-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-white/10 flex items-center justify-center font-mono font-bold text-sm text-cyan-300">
                    {p.nickname.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white flex items-center gap-1.5">
                      {p.nickname}
                      {p.isHost && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono border border-amber-500/30">
                          HOST
                        </span>
                      )}
                      {isMe && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-500/30">
                          TÚ
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-mono text-zinc-500">
                      {p.isReady ? 'Listo para el despliegue' : 'Sincronizando...'}
                    </span>
                  </div>
                </div>

                <div className={`w-2.5 h-2.5 rounded-full ${p.isReady ? 'bg-emerald-400 shadow-[0_0_8px_#10b981]' : 'bg-zinc-600'}`} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Acciones del Lobby */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={toggleReady}
          className={`flex-1 py-3.5 px-6 rounded-xl font-bold text-sm font-mono tracking-wider border transition ${
            me.isReady
              ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-white/10'
              : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 border-emerald-400 shadow-lg shadow-emerald-500/20'
          }`}
        >
          {me.isReady ? 'CANCELAR LISTO' : 'ESTOY LISTO'}
        </button>

        {isHost && (
          <button
            onClick={startGame}
            disabled={!canStart}
            className="flex-1 py-3.5 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-zinc-950 font-bold text-sm font-mono tracking-wider shadow-lg shadow-cyan-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-current" />
            INICIAR PARTIDA
          </button>
        )}
      </div>
    </div>
  );
};
