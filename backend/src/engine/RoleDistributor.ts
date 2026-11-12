import { RoleId, ROLES } from '@operacion-filtracion/shared';

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function distributeRoles(playerCount: number): RoleId[] {
  const roles: RoleId[] = [];

  if (playerCount <= 5) {
    // Modo testing / rápido
    roles.push('CEO', 'OSINT_ANALYST', 'PARAMEDIC', 'SMART_CAM_CITIZEN');
    if (playerCount === 5) {
      roles.push(Math.random() > 0.5 ? 'BLACK_HAT_HACKER' : 'TROLL');
    }
    return shuffle(roles);
  }

  if (playerCount >= 6 && playerCount <= 7) {
    // 2 Mafias (1 CEO + 1 Hacker o Deepfake)
    roles.push('CEO');
    roles.push(Math.random() > 0.5 ? 'BLACK_HAT_HACKER' : 'DEEPFAKE_SPECIALIST');

    // 4 a 5 Ciudadanos (1 OSINT, 1 Paramédico, resto Smart-Cam)
    roles.push('OSINT_ANALYST', 'PARAMEDIC');
    const citizensRemaining = playerCount - roles.length;
    for (let i = 0; i < citizensRemaining; i++) {
      roles.push('SMART_CAM_CITIZEN');
    }
    return shuffle(roles);
  }

  if (playerCount >= 8 && playerCount <= 10) {
    // 2 Mafias
    roles.push('CEO');
    roles.push(Math.random() > 0.5 ? 'BLACK_HAT_HACKER' : 'DEEPFAKE_SPECIALIST');

    // 1 Neutral
    roles.push(Math.random() > 0.5 ? 'TROLL' : 'HITMAN');

    // Ciudadanos (1 OSINT, 1 Paramédico, 1 Periodista, resto Smart-Cam)
    roles.push('OSINT_ANALYST', 'PARAMEDIC', 'JOURNALIST');
    const citizensRemaining = playerCount - roles.length;
    for (let i = 0; i < citizensRemaining; i++) {
      roles.push('SMART_CAM_CITIZEN');
    }
    return shuffle(roles);
  }

  // 11 a 14 Jugadores
  // 3 Mafias (1 CEO, 1 Deepfake, 1 Hacker)
  roles.push('CEO', 'DEEPFAKE_SPECIALIST', 'BLACK_HAT_HACKER');

  // Neutrales (1 o 2)
  if (playerCount >= 13) {
    roles.push('TROLL', 'HITMAN');
  } else {
    roles.push(Math.random() > 0.5 ? 'TROLL' : 'HITMAN');
  }

  // Ciudadanos (1 OSINT, 1 Paramédico, 1 Periodista, resto Smart-Cam)
  roles.push('OSINT_ANALYST', 'PARAMEDIC', 'JOURNALIST');
  const citizensRemaining = playerCount - roles.length;
  for (let i = 0; i < citizensRemaining; i++) {
    roles.push('SMART_CAM_CITIZEN');
  }

  return shuffle(roles);
}
