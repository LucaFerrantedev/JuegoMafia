import {
  GameState,
  ClientGameState,
  PublicPlayerInfo
} from '@operacion-filtracion/shared';

export function sanitizeGameState(state: GameState, forPlayerId: string): ClientGameState {
  const me = state.players[forPlayerId];

  // Si el jugador no existe (ej. reconexión fallida o espectador no registrado), entregamos fallback seguro
  const defaultMe = {
    id: forPlayerId,
    nickname: 'Anon',
    role: 'SMART_CAM_CITIZEN' as const,
    faction: 'CITIZEN' as const,
    isAlive: false,
    isHost: false,
    isSilenced: false,
    dmsRemainingToday: 0,
    remainingAbilityUses: 0
  };

  // Armar lista pública de jugadores sin filtrar roles de vivos
  const publicPlayers: PublicPlayerInfo[] = Object.values(state.players).map(p => {
    const isSelf = p.id === forPlayerId;
    const isGameOver = state.phase === 'GAME_OVER';
    const isTeammateCartel = me?.faction === 'CARTEL' && p.faction === 'CARTEL';

    const shouldRevealRole = isSelf || !p.isAlive || isGameOver || isTeammateCartel;

    return {
      id: p.id,
      nickname: p.nickname,
      avatarSeed: p.avatarSeed,
      isHost: p.isHost,
      isReady: p.isReady,
      isAlive: p.isAlive,
      isSilenced: p.isSilenced,
      hasNominated: p.hasNominated,
      hasVotedVerdict: !!p.verdictVote,
      revealedRole: shouldRevealRole ? p.role : undefined,
      revealedFaction: shouldRevealRole ? p.faction : undefined
    };
  });

  // Conteo de nominaciones
  const nominationsCount: Record<string, number> = {};
  Object.values(state.nominations).forEach(nomineeId => {
    nominationsCount[nomineeId] = (nominationsCount[nomineeId] || 0) + 1;
  });

  // Veredicto
  let verdictTally = undefined;
  if (state.phase === 'VERDICT_VOTE' || state.phase === 'NOMINATION_AND_DEFENSE') {
    let guiltyCount = 0;
    let innocentCount = 0;
    let abstainCount = 0;

    Object.values(state.verdictVotes).forEach(vote => {
      if (vote === 'GUILTY') guiltyCount++;
      if (vote === 'INNOCENT') innocentCount++;
      if (vote === 'ABSTAIN') abstainCount++;
    });

    const isCloudOutage = state.activeTrend === 'CLOUD_OUTAGE';

    verdictTally = {
      guiltyCount,
      innocentCount,
      abstainCount,
      voterDetails: isCloudOutage ? undefined : state.verdictVotes
    };
  }

  // Compañeros de mafia si aplica
  let teammates = undefined;
  if (me && me.faction === 'CARTEL') {
    teammates = Object.values(state.players)
      .filter(p => p.faction === 'CARTEL')
      .map(p => ({
        id: p.id,
        nickname: p.nickname,
        role: p.role
      }));
  }

  // Objetivo del Hitman
  let hitmanTargetNickname = undefined;
  if (me && me.role === 'HITMAN' && me.hitmanTargetPlayerId) {
    hitmanTargetNickname = state.players[me.hitmanTargetPlayerId]?.nickname;
  }

  const nominatedPlayer = state.nominatedPlayerId
    ? publicPlayers.find(p => p.id === state.nominatedPlayerId)
    : undefined;

  return {
    roomCode: state.roomCode,
    phase: state.phase,
    roundNumber: state.roundNumber,
    phaseDurationSeconds: state.phaseDurationSeconds,
    phaseTimeRemaining: state.phaseTimeRemaining,
    activeTrend: state.activeTrend,
    players: publicPlayers,
    me: me
      ? {
          id: me.id,
          nickname: me.nickname,
          role: me.role,
          faction: me.faction,
          isAlive: me.isAlive,
          isHost: me.isHost,
          isSilenced: me.isSilenced,
          dmsRemainingToday: me.dmsRemainingToday,
          remainingAbilityUses: me.remainingAbilityUses,
          hitmanTargetNickname,
          teammates,
          myNightAction: state.pendingNightActions[me.id]
        }
      : defaultMe,
    nominatedPlayer,
    nominationsCount,
    verdictTally,
    morningBulletin: state.morningBulletin,
    winner: state.winner
  };
}
