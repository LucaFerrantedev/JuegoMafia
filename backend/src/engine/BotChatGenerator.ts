import { BotPersonality, DailyTrendId, RoleId, ROLES } from '@operacion-filtracion/shared';

export type ChatIntent =
  | 'ACUSACION_FUERTE'
  | 'SOSPECHA_GENERAL'
  | 'DEFENSA_ESTRADO'
  | 'COMENTARIO_TENDENCIA'
  | 'OBSERVACION_CASUAL';

interface MessageContext {
  botNickname: string;
  personality: BotPersonality;
  targetNickname?: string;
  claimedRole?: RoleId;
  activeTrend?: DailyTrendId;
  roundNumber?: number;
  intelProof?: string;
}

const TEMPLATES: Record<BotPersonality, Record<ChatIntent, (ctx: MessageContext) => string[]>> = {
  agresivo: {
    ACUSACION_FUERTE: (ctx) => [
      `¡No den más vueltas! ${ctx.targetNickname} es 100% culpable, miren sus registros de anoche.`,
      `Dejen de dudar. Suban a ${ctx.targetNickname} al estrado ahora mismo si no quieren perder el control de la sala.`,
      `Está cantadísimo lo de ${ctx.targetNickname}. No tiene coartada y se nota el silencio cómplice.`,
      `Si no votamos a ${ctx.targetNickname} hoy, la mafia nos liquida esta noche. ¡Voten ya!`
    ],
    SOSPECHA_GENERAL: (ctx) => [
      `Hay algo muy turbio en cómo se mueve ${ctx.targetNickname}. Lo tengo bajo la mira.`,
      `${ctx.targetNickname} está jugando demasiado a la defensiva. No me cierra nada su postura.`,
      `Ojo con ${ctx.targetNickname}, está desviando sospechas desde temprano.`
    ],
    DEFENSA_ESTRADO: (ctx) => [
      `¡Están cometiendo un error gravísimo! Soy ${ctx.claimedRole ? ROLES[ctx.claimedRole].name : 'Inocente'}, si me eliminan le regalan la partida al Cártel.`,
      `¿En serio me van a votar a mí? Mi rol es ${ctx.claimedRole ? ROLES[ctx.claimedRole].name : 'fundamental'} y estuve trabajando para la ciudad. ¡Abran los ojos!`,
      `Linchenme si quieren tirar la partida a la basura, pero recuerden quién fue el que empujó esta acusación cuando vean mi rol real.`
    ],
    COMENTARIO_TENDENCIA: (ctx) => [
      ctx.activeTrend === 'CHAT_LEAKS'
        ? '¡Ese leak del chat de la mafia es clave! Hay que analizar bien las palabras que usaron.'
        : ctx.activeTrend === 'CLOUD_OUTAGE'
        ? 'Genial, votos anónimos... ahora los infiltrados se van a esconder como ratas en el juicio.'
        : ctx.activeTrend === 'TWO_FACTOR_REQUIRED'
        ? 'Mejor que no haya abstención hoy, acá nadie se lava las manos.'
        : '¡Viralización instantánea! El primero que titubee va directo al estrado.'
    ],
    OBSERVACION_CASUAL: () => [
      'Menos charla vacía y más cruzar datos de quién votó a quién ayer.',
      'La noche estuvo pesada, tenemos que actuar rápido antes del juicio.',
      'No confío en nadie que no haya expuesto qué hizo anoche.'
    ]
  },

  analitico: {
    ACUSACION_FUERTE: (ctx) => [
      `Revisando los metadatos y la correlación de eventos, la probabilidad de que ${ctx.targetNickname} sea del Cártel supera el 85%.`,
      `Los registros de antenas y tiempos no coinciden con la coartada de ${ctx.targetNickname}. Las pruebas son contundentes.`,
      `El análisis forense apunta directo a ${ctx.targetNickname}. Estadísticamente es la deducción más segura del día.`
    ],
    SOSPECHA_GENERAL: (ctx) => [
      `El patrón de votos de ${ctx.targetNickname} en la ronda anterior presenta anomalías estadísticas con respecto al bloque ciudadano.`,
      `He detectado una inconsistencia en los tiempos de respuesta de ${ctx.targetNickname}. Mantengámoslo en observación.`,
      `Cruzando los movimientos con el boletín matutino, ${ctx.targetNickname} queda como nodo sospechoso.`
    ],
    DEFENSA_ESTRADO: (ctx) => [
      `El veredicto en mi contra carece de fundamento lógico. Mi función asignada es ${ctx.claimedRole ? ROLES[ctx.claimedRole].name : 'clave en la red'} y mis acciones están verificadas.`,
      `Revisen la secuencia de eventos: mis votos siempre buscaron desarticular al Cártel. Como ${ctx.claimedRole ? ROLES[ctx.claimedRole].name : 'agente'}, mi baja nos dejará a ciegas.`,
      `Votar culpable aquí reducirá la ventana matemática de victoria ciudadana en un 40%. Voten con criterio: INOCENTE.`
    ],
    COMENTARIO_TENDENCIA: (ctx) => [
      ctx.activeTrend === 'CHAT_LEAKS'
        ? 'El paquete filtrado de la mafia coincide sintácticamente con ciertos estilos en el debate de ayer.'
        : ctx.activeTrend === 'CLOUD_OUTAGE'
        ? 'El escrutinio anónimo introduce ruido estocástico. Debemos anotar manualmente quién defiende a quién.'
        : ctx.activeTrend === 'TWO_FACTOR_REQUIRED'
        ? 'El bloqueo de abstención fuerza a definir posiciones binarias, facilitando el análisis de bandos.'
        : 'Viralización instantánea: un umbral de 3 votos requiere consenso rápido y bien fundamentado.'
    ],
    OBSERVACION_CASUAL: () => [
      'Procesando el reporte forense matutino. Hay detalles interesantes en las pistas.',
      'Recordemos contrastar las declaraciones con los informes de inteligencia recibidos.',
      'El análisis de red muestra que la mafia busca fragmentar el voto de los ciudadanos.'
    ]
  },

  callado: {
    ACUSACION_FUERTE: (ctx) => [
      `Es ${ctx.targetNickname}. No tengo dudas.`,
      `Voto a ${ctx.targetNickname}, las pruebas son claras.`,
      `Suban a ${ctx.targetNickname}. Hay que resolver esto ya.`
    ],
    SOSPECHA_GENERAL: (ctx) => [
      `${ctx.targetNickname} me genera desconfianza.`,
      `No me convence lo que dice ${ctx.targetNickname}.`,
      `Cuidado con ${ctx.targetNickname}.`
    ],
    DEFENSA_ESTRADO: (ctx) => [
      `Soy ${ctx.claimedRole ? ROLES[ctx.claimedRole].name : 'inocente'}. Si me eliminan se equivocan.`,
      `No soy mafia. Mi rol es ${ctx.claimedRole ? ROLES[ctx.claimedRole].name : 'ciudadano'}, piénsenlo antes de votar.`,
      `Inocente. No desperdicien el linchamiento en mí.`
    ],
    COMENTARIO_TENDENCIA: (ctx) => [
      ctx.activeTrend === 'CHAT_LEAKS'
        ? 'Ese mensaje filtrado dice bastante.'
        : ctx.activeTrend === 'CLOUD_OUTAGE'
        ? 'Cuidado hoy, los votos están ocultos.'
        : ctx.activeTrend === 'TWO_FACTOR_REQUIRED'
        ? 'Sin abstención. Hay que elegir bien.'
        : 'Con 3 acusaciones sube... ojo a quién nominan.'
    ],
    OBSERVACION_CASUAL: () => [
      'Leyendo el chat con atención...',
      'Prefiero esperar antes de acusar sin fundamento.',
      'Sigo analizando lo que pasó anoche.'
    ]
  },

  caotico: {
    ACUSACION_FUERTE: (ctx) => [
      `¡Basta de teorías conspirativas! ¡${ctx.targetNickname} está hasta las manos, manden fuego! 🔥`,
      `¡Se le cayó la máscara a ${ctx.targetNickname}! No me vengan con cuentos raros, al estrado de una.`,
      `¡Alerta roja total con ${ctx.targetNickname}! Si no lo sacamos hoy, nos van a farmear a todos.`
    ],
    SOSPECHA_GENERAL: (ctx) => [
      `Esa vibra de ${ctx.targetNickname} me huele a infiltrado corporativo desde la ronda 1 👀`,
      `¿Alguien más vio cómo ${ctx.targetNickname} cambió de tema de golpe? Muy sospechoso...`,
      `Tengo un presentimiento fuertísimo con ${ctx.targetNickname}. No le compraría ni un pendrive.`
    ],
    DEFENSA_ESTRADO: (ctx) => [
      `¡Paren la mano! ¡Están cazando al fantasma equivocado! Soy ${ctx.claimedRole ? ROLES[ctx.claimedRole].name : 'de los buenos'} y nos vamos a arrepentir todos.`,
      `¡Esto es una trampa de la mafia para limpiar a la resistencia! Soy ${ctx.claimedRole ? ROLES[ctx.claimedRole].name : 'inocente'}, ¡voten inocente carajo!`,
      `Si me linchan van a quedar expuestos todos los que votaron culpable. ¡Hagan lo que tengan que hacer!`
    ],
    COMENTARIO_TENDENCIA: (ctx) => [
      ctx.activeTrend === 'CHAT_LEAKS'
        ? '¡Upaaa tremendo leak! Se les escapó el paquete a los de sombrero negro jajaja.'
        : ctx.activeTrend === 'CLOUD_OUTAGE'
        ? '¡Modo sigilo activado! Servidores caídos, hoy vale todo.'
        : ctx.activeTrend === 'TWO_FACTOR_REQUIRED'
        ? '¡2FA para todos! Hoy nadie se esconde atrás de la abstención.'
        : '¡Viralización express! Un par de retweets y al estrado directo 🚀'
    ],
    OBSERVACION_CASUAL: () => [
      'Alguien acá está mintiendo como un campeón y lo vamos a descubrir.',
      'Menos mal que el café todavía es legal en este distópico 2026.',
      'Siento olor a malware en el ambiente digital muchachos.'
    ]
  }
};

export function generateBotMessage(intent: ChatIntent, ctx: MessageContext): string {
  const personalityMap = TEMPLATES[ctx.personality] || TEMPLATES.analitico;
  const generator = personalityMap[intent] || personalityMap.OBSERVACION_CASUAL;
  const options = generator(ctx);
  const randomIndex = Math.floor(Math.random() * options.length);
  return options[randomIndex];
}
