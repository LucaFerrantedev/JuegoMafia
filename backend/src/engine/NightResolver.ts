import {
  GameState,
  PlayerState,
  PlayerNightAction,
  MorningBulletin,
  IntelReport,
  RoleId
} from '@operacion-filtracion/shared';

export interface NightResolutionResult {
  victims: {
    playerId: string;
    nickname: string;
    revealedRole?: RoleId;
  }[];
  intelReports: Record<string, IntelReport>; // playerId -> report
  forensicNotes: string[];
}

export function resolveNightOperations(
  state: GameState
): NightResolutionResult {
  const players = state.players;
  const actions = Object.values(state.pendingNightActions);
  const intelReports: Record<string, IntelReport> = {};
  const forensicNotes: string[] = [];

  // Reset temporal por noche
  Object.values(players).forEach(p => {
    p.isProtected = false;
    p.isDDoSedThisNight = false;
    p.visitedBy = [];
  });

  // ========================================================
  // PASO 1: Bloqueos de Red (Hacker DDoS)
  // ========================================================
  const hackerActions = actions.filter(a => a.type === 'HACKER_DDOS');
  for (const act of hackerActions) {
    const actor = players[act.actorId];
    if (!actor || !actor.isAlive) continue;

    const target = act.targetId ? players[act.targetId] : undefined;
    if (!target || !target.isAlive) continue;

    target.visitedBy.push(actor.id);

    if (act.meta?.ddosMode === 'SILENCE_DAY') {
      target.isSilenced = true;
      forensicNotes.push(`Se detectó una sobrecarga de red maliciosa en los servidores de mensajería diurna.`);
    } else {
      // Bloquea su acción nocturna
      target.isDDoSedThisNight = true;
    }
  }

  // Filtrar acciones válidas que NO hayan sido bloqueadas por DDoS
  const validActions = actions.filter(act => {
    const actor = players[act.actorId];
    if (!actor || !actor.isAlive) return false;
    if (actor.isDDoSedThisNight) {
      intelReports[actor.id] = {
        type: 'OSINT',
        title: 'ALERTA DE SEGURIDAD',
        content: 'Tu terminal sufrió un ataque DDoS. Todas tus operaciones fueron denegadas.'
      };
      return false;
    }
    return true;
  });

  // ========================================================
  // PASO 2: Alteraciones de Identidad (Deepfakes)
  // ========================================================
  let framedPlayerId: string | undefined;
  let obituaryAlteration: { targetId: string; fakeRole: RoleId } | undefined;

  const deepfakeActions = validActions.filter(a => a.type === 'DEEPFAKE_FRAME');
  for (const act of deepfakeActions) {
    const actor = players[act.actorId];
    if (!actor || actor.remainingAbilityUses <= 0) continue;

    actor.remainingAbilityUses -= 1;
    if (act.targetId && players[act.targetId]) {
      players[act.targetId].visitedBy.push(actor.id);
      if (act.meta?.fakeRoleId) {
        obituaryAlteration = {
          targetId: act.targetId,
          fakeRole: act.meta.fakeRoleId
        };
      } else {
        framedPlayerId = act.targetId;
      }
    }
  }

  // ========================================================
  // PASO 3: Protección de Emergencia (Paramédico)
  // ========================================================
  const paramedicActions = validActions.filter(a => a.type === 'PARAMEDIC_HEAL');
  for (const act of paramedicActions) {
    const actor = players[act.actorId];
    if (!actor) continue;

    const target = act.targetId ? players[act.targetId] : undefined;
    if (!target || !target.isAlive) continue;

    // Regla de balance: no proteger a la misma persona dos noches consecutivas
    if (actor.lastHealedTargetId === target.id) {
      continue;
    }

    target.isProtected = true;
    target.visitedBy.push(actor.id);
    actor.lastHealedTargetId = target.id;
  }

  // ========================================================
  // PASO 4: Ataque del Cártel (El CEO / Capo)
  // ========================================================
  // La víctima se decide por el voto del CEO o consenso de la mafia
  const killActions = validActions.filter(a => a.type === 'CARTEL_KILL');
  let chosenVictimId: string | undefined;

  // Si el CEO envió la orden, tiene prioridad absoluta
  const ceoAction = killActions.find(a => players[a.actorId]?.role === 'CEO');
  if (ceoAction?.targetId) {
    chosenVictimId = ceoAction.targetId;
  } else if (killActions.length > 0 && killActions[0].targetId) {
    chosenVictimId = killActions[0].targetId;
  }

  const victims: { playerId: string; nickname: string; revealedRole?: RoleId }[] = [];

  if (chosenVictimId && players[chosenVictimId]) {
    const victim = players[chosenVictimId];
    
    // Registrar visita de los agresores
    killActions.forEach(a => victim.visitedBy.push(a.actorId));

    if (victim.isProtected) {
      forensicNotes.push(`Unidades de emergencia médica interceptaron un atentado en curso.`);
    } else {
      victim.isAlive = false;

      // Aplicar alteración de obituario de Deepfake si existió
      let roleToReveal = victim.role;
      if (obituaryAlteration && obituaryAlteration.targetId === victim.id) {
        roleToReveal = obituaryAlteration.fakeRole;
        forensicNotes.push(`Se detectaron anomalías biométricas en los registros forenses.`);
      }

      victims.push({
        playerId: victim.id,
        nickname: victim.nickname,
        revealedRole: roleToReveal
      });
    }
  } else {
    forensicNotes.push(`La noche transcurrió sin incidentes letales reportados.`);
  }

  // ========================================================
  // PASO 5: Recolección de Inteligencia (OSINT, Periodista, Smart-Cam)
  // ========================================================

  // 5.1 Analista OSINT
  const osintActions = validActions.filter(a => a.type === 'OSINT_INVESTIGATE');
  for (const act of osintActions) {
    const actor = players[act.actorId];
    const target = act.targetId ? players[act.targetId] : undefined;
    if (!actor || !target) continue;

    target.visitedBy.push(actor.id);

    // Caso CEO en su primera investigación: sus abogados limpian su rastro
    if (target.role === 'CEO' && !target.ceoInvestigatedBefore) {
      target.ceoInvestigatedBefore = true;
      intelReports[actor.id] = {
        type: 'OSINT',
        title: `REPORTE DIGITAL: ${target.nickname}`,
        content: `Cifrado de grado corporativo detectado. El historial de tráfico muestra: "Sin actividad sospechosa".`
      };
      continue;
    }

    // Si fue inculpado por Deepfake o si atacó a la víctima
    const targetAction = validActions.find(a => a.actorId === target.id);
    const wasWithVictim = chosenVictimId && targetAction?.targetId === chosenVictimId;
    const isFramed = framedPlayerId === target.id;

    if (wasWithVictim || isFramed) {
      intelReports[actor.id] = {
        type: 'OSINT',
        title: `REPORTE DIGITAL: ${target.nickname}`,
        content: `ALERTA ROJA: El dispositivo de ${target.nickname} estuvo conectado a la misma antena celular y torre repetidora que la víctima.`
      };
    } else if (targetAction) {
      intelReports[actor.id] = {
        type: 'OSINT',
        title: `REPORTE DIGITAL: ${target.nickname}`,
        content: `TRAZABILIDAD: Se detectó tráfico anómalo y conexión a redes externas durante la madrugada.`
      };
    } else {
      intelReports[actor.id] = {
        type: 'OSINT',
        title: `REPORTE DIGITAL: ${target.nickname}`,
        content: `INFORME RUTINARIO: El dispositivo de ${target.nickname} permaneció conectado a su red WiFi doméstica sin desplazamientos registrados.`
      };
    }
  }

  // 5.2 Periodista de Investigación (Whistleblower)
  const journalistActions = validActions.filter(a => a.type === 'JOURNALIST_COMPARE');
  for (const act of journalistActions) {
    const actor = players[act.actorId];
    const target1 = act.targetId ? players[act.targetId] : undefined;
    const target2 = act.secondaryTargetId ? players[act.secondaryTargetId] : undefined;
    if (!actor || !target1 || !target2) continue;

    target1.visitedBy.push(actor.id);
    target2.visitedBy.push(actor.id);

    const sameFaction = target1.faction === target2.faction;
    intelReports[actor.id] = {
      type: 'JOURNALIST',
      title: `CRUCE DE DATOS: ${target1.nickname} vs ${target2.nickname}`,
      content: sameFaction
        ? `NODO COINCIDENTE: Ambos sujetos operan dentro de la MISMA red de influencia.`
        : `REDES OPUESTAS: Los metadatos indican que ambos sujetos operan en BANDOS DIFERENTES.`,
      sameNetwork: sameFaction
    };
  }

  // 5.3 Vecino con Smart-Cam
  const smartCamActions = validActions.filter(a => a.type === 'SMART_CAM_ACTIVATE');
  for (const act of smartCamActions) {
    const actor = players[act.actorId];
    if (!actor || actor.remainingAbilityUses <= 0) continue;

    actor.remainingAbilityUses -= 1;

    // Visitantes reales (excluyéndose a sí mismo)
    const realVisitors = actor.visitedBy.filter(id => id !== actor.id);

    if (realVisitors.length === 0) {
      intelReports[actor.id] = {
        type: 'SMART_CAM',
        title: 'DOORBELL GUARD PRO',
        content: 'Sensor perimetral: No se registró movimiento ni actividad frente a tu puerta durante la noche.'
      };
    } else {
      // Tomamos a los visitantes reales y agregamos 1 o 2 sospechosos aleatorios inocentes para formar los 2 o 3 nombres
      const candidateIds = new Set<string>(realVisitors);
      const otherPlayers = Object.keys(players).filter(id => id !== actor.id && !candidateIds.has(id));
      
      while (candidateIds.size < 3 && otherPlayers.length > 0) {
        const randIndex = Math.floor(Math.random() * otherPlayers.length);
        candidateIds.add(otherPlayers[randIndex]);
        otherPlayers.splice(randIndex, 1);
      }

      const suspectNicknames = Array.from(candidateIds).map(id => players[id]?.nickname || 'Desconocido');
      intelReports[actor.id] = {
        type: 'SMART_CAM',
        title: 'DOORBELL GUARD PRO: ¡MOVIMIENTO DETECTADO!',
        content: `Tu cámara detectó siluetas frente a tu puerta. Entre los sospechosos identificados están: ${suspectNicknames.join(', ')}.`,
        suspects: suspectNicknames
      };
    }
  }

  return {
    victims,
    intelReports,
    forensicNotes
  };
}
