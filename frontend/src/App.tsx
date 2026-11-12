import React, { useState } from 'react';
import { SocketProvider, useSocket } from './context/SocketContext';
import { OSHeader } from './components/layout/OSHeader';
import { LobbyView } from './components/lobby/LobbyView';
import { RoleIntroModal } from './components/common/RoleIntroModal';
import { NewsFeedView } from './components/dashboard/NewsFeedView';
import { MessengerView } from './components/messenger/MessengerView';
import { CourtroomView } from './components/courtroom/CourtroomView';
import { NightOperationsView } from './components/apps/NightOperationsView';
import { GameOverModal } from './components/common/GameOverModal';
import {
  MessageSquare,
  Newspaper,
  Scale,
  Activity,
  AlertCircle,
  X
} from 'lucide-react';

const MainScreen: React.FC = () => {
  const { gameState, notification, setNotification } = useSocket();
  const [activeTab, setActiveTab] = useState<'AUTO' | 'CHAT' | 'NEWS' | 'COURT' | 'APPS'>('AUTO');

  if (!gameState || gameState.phase === 'LOBBY') {
    return (
      <div className="min-h-screen flex flex-col justify-between">
        <OSHeader />
        <main className="flex-1 flex items-center justify-center p-4">
          <LobbyView />
        </main>
      </div>
    );
  }

  // Determinar vista por defecto si activeTab es AUTO
  let currentView = activeTab;
  if (currentView === 'AUTO') {
    if (gameState.phase === 'MORNING_NEWS_FEED') currentView = 'NEWS';
    else if (gameState.phase === 'DAY_CHAT_AND_DM') currentView = 'CHAT';
    else if (gameState.phase === 'NOMINATION_AND_DEFENSE' || gameState.phase === 'VERDICT_VOTE') currentView = 'COURT';
    else if (gameState.phase === 'NIGHT_OPERATIONS') currentView = 'APPS';
    else currentView = 'CHAT';
  }

  return (
    <div className="min-h-screen flex flex-col justify-between pb-20">
      <OSHeader />

      {/* Notificación Flotante de Error o Alerta */}
      {notification && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 max-w-md w-full px-4 animate-bounce">
          <div className="p-3.5 rounded-xl bg-rose-950/90 border border-rose-500/50 text-rose-200 text-xs font-mono flex items-center justify-between shadow-2xl backdrop-blur-md">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{notification}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="p-1 hover:bg-rose-900 rounded"
            >
              <X className="w-4 h-4 text-rose-300" />
            </button>
          </div>
        </div>
      )}

      {/* Contenido Principal según Vista */}
      <main className="flex-1 p-4 flex flex-col justify-center">
        {currentView === 'NEWS' && <NewsFeedView />}
        {currentView === 'CHAT' && <MessengerView />}
        {currentView === 'COURT' && <CourtroomView />}
        {currentView === 'APPS' && <NightOperationsView />}
      </main>

      {/* Modales Automáticos de Estado */}
      <RoleIntroModal />
      <GameOverModal />

      {/* Dock Inferior Móvil (Estilo Smartphone 2026) */}
      <nav className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 glass-panel px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-2 shadow-2xl">
        <button
          onClick={() => setActiveTab('CHAT')}
          className={`px-3 py-1.5 rounded-xl font-mono text-xs flex items-center gap-1.5 transition ${
            currentView === 'CHAT'
              ? 'bg-cyan-500 text-zinc-950 font-bold shadow-md shadow-cyan-500/20'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span className="hidden sm:inline">Mensajería</span>
        </button>

        <button
          onClick={() => setActiveTab('NEWS')}
          className={`px-3 py-1.5 rounded-xl font-mono text-xs flex items-center gap-1.5 transition ${
            currentView === 'NEWS'
              ? 'bg-amber-500 text-zinc-950 font-bold shadow-md shadow-amber-500/20'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Newspaper className="w-4 h-4" />
          <span className="hidden sm:inline">Boletín</span>
        </button>

        <button
          onClick={() => setActiveTab('COURT')}
          className={`px-3 py-1.5 rounded-xl font-mono text-xs flex items-center gap-1.5 transition ${
            currentView === 'COURT'
              ? 'bg-orange-500 text-zinc-950 font-bold shadow-md shadow-orange-500/20'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span className="hidden sm:inline">Tribunal</span>
        </button>

        <button
          onClick={() => setActiveTab('APPS')}
          className={`px-3 py-1.5 rounded-xl font-mono text-xs flex items-center gap-1.5 transition ${
            currentView === 'APPS'
              ? 'bg-purple-500 text-white font-bold shadow-md shadow-purple-500/20'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span className="hidden sm:inline">Apps Nocturnas</span>
        </button>
      </nav>
    </div>
  );
};

export default function App() {
  return (
    <SocketProvider>
      <MainScreen />
    </SocketProvider>
  );
}
