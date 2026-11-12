export type Faction = 'CARTEL' | 'CITIZEN' | 'NEUTRAL';

export type RoleId =
  // Cártel Corporativo (Mafia)
  | 'CEO'
  | 'DEEPFAKE_SPECIALIST'
  | 'BLACK_HAT_HACKER'
  // Ciudadanos (Testigos y Agentes)
  | 'OSINT_ANALYST'
  | 'PARAMEDIC'
  | 'JOURNALIST'
  | 'SMART_CAM_CITIZEN'
  // Neutrales (Agentes del Caos)
  | 'TROLL'
  | 'HITMAN';

export interface RoleDefinition {
  id: RoleId;
  name: string;
  faction: Faction;
  summary: string;
  description: string;
  iconName: string; // Nombre de icono de Lucide
  appTitle?: string;
  maxUses?: number; // usos máximos (ej. SmartCam: 2, Deepfake: 1)
}

export const ROLES: Record<RoleId, RoleDefinition> = {
  CEO: {
    id: 'CEO',
    name: 'El CEO / Capo',
    faction: 'CARTEL',
    summary: 'Líder del Cártel con algoritmos legales de encubrimiento.',
    description: 'Toma la decisión final de eliminación nocturna. La primera vez que el Analista OSINT te investigue, tus abogados limpian tu rastro y aparecerás como "Sin actividad sospechosa".',
    iconName: 'Briefcase',
    appTitle: 'Dark Executive Terminal'
  },
  DEEPFAKE_SPECIALIST: {
    id: 'DEEPFAKE_SPECIALIST',
    name: 'Especialista en Deepfakes',
    faction: 'CARTEL',
    summary: 'Falsifica registros digitales y altera identidades.',
    description: 'Dispones de 1 uso por partida para suplantar la identidad digital de un inocente (haciendo que GPS y cámaras lo detecten saliendo de su casa) o falsificar el rol en el obituario de una víctima.',
    iconName: 'ScanFace',
    appTitle: 'Synthetix Deepfake Studio',
    maxUses: 1
  },
  BLACK_HAT_HACKER: {
    id: 'BLACK_HAT_HACKER',
    name: 'Hacker de Sombrero Negro',
    faction: 'CARTEL',
    summary: 'Ataques DDoS para bloquear acciones o silenciar en debates.',
    description: 'Ejecuta un ataque DDoS sobre un objetivo: puedes anular su habilidad nocturna en tiempo real o hackear su terminal para dejarlo silenciado en el chat general del día siguiente.',
    iconName: 'Terminal',
    appTitle: 'Zero-Day Botnet Console'
  },
  OSINT_ANALYST: {
    id: 'OSINT_ANALYST',
    name: 'Analista OSINT',
    faction: 'CITIZEN',
    summary: 'Rastreo forense de antenas celulares y geolocalización.',
    description: 'Inspecciona la huella digital nocturna de un jugador. Descubre si estuvo conectado a la misma antena celular que la víctima o si permaneció inmóvil en su domicilio.',
    iconName: 'Radar',
    appTitle: 'OSINT Geolocation Tracker'
  },
  PARAMEDIC: {
    id: 'PARAMEDIC',
    name: 'Paramédico / Médico de Emergencias',
    faction: 'CITIZEN',
    summary: 'Blindaje médico y respuesta rápida ante atentados.',
    description: 'Despacha una unidad médica táctica al domicilio de un jugador para salvarlo de un atentado. Regla de balance: no puedes proteger a la misma persona dos noches consecutivas.',
    iconName: 'HeartPulse',
    appTitle: 'Rapid Medical Dispatch'
  },
  JOURNALIST: {
    id: 'JOURNALIST',
    name: 'Periodista de Investigación',
    faction: 'CITIZEN',
    summary: 'Cruce de bases de datos para detectar redes y complicidades.',
    description: 'Cruza registros de 2 jugadores cada noche para determinar si operan en la misma red (mismo bando) o en redes opuestas (bandos diferentes), sin saber sus roles específicos.',
    iconName: 'Fingerprint',
    appTitle: 'Cross-Leak Database'
  },
  SMART_CAM_CITIZEN: {
    id: 'SMART_CAM_CITIZEN',
    name: 'Vecino con Smart-Cam',
    faction: 'CITIZEN',
    summary: 'Timbre inteligente con detección de proximidad.',
    description: 'Cuentas con una cámara inteligente en tu puerta con batería para 2 usos por partida. Si alguien te visita de noche, recibirás una alerta con 2 o 3 sospechosos que estuvieron en tu puerta.',
    iconName: 'Camera',
    appTitle: 'Doorbell Guard Pro',
    maxUses: 2
  },
  TROLL: {
    id: 'TROLL',
    name: 'El Troll / Ragebaiter',
    faction: 'NEUTRAL',
    summary: 'Busca ser cancelado públicamente en el juicio.',
    description: 'Ganas la partida si logras que los jugadores voten tu linchamiento como Culpable en el juicio diurno. Al ser cancelado, filtrará públicamente el rol de uno de los que votaron en tu contra.',
    iconName: 'Flame',
    appTitle: 'FlameWar Viral Hub'
  },
  HITMAN: {
    id: 'HITMAN',
    name: 'Mercenario Freelance',
    faction: 'NEUTRAL',
    summary: 'Contrato confidencial en criptomonedas en la Dark Web.',
    description: 'En la Noche 1 recibes un contrato con el objetivo ciudadano que debes ver eliminado. Si ese objetivo muere (sea de día o de noche) mientras tú sigas con vida, cobras tu recompensa y ganas.',
    iconName: 'Crosshair',
    appTitle: 'DarkPool Bounty Contract'
  }
};
