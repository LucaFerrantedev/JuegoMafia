export const PHASE_DURATIONS = {
  ROLE_ASSIGNMENT: 8,       // 8s para asimilar rol, objetivo y apps
  NIGHT_OPERATIONS: 35,     // 35s según GDD
  MORNING_NEWS_FEED: 18,    // 18s para leer boletín, víctimas y tendencia
  DAY_CHAT_AND_DM: 75,      // 75-90s de debate general y DMs
  NOMINATION_AND_DEFENSE: 30, // 30s para nominar y alegato de defensa
  VERDICT_VOTE: 15          // 15s para emitir veredicto final
};

export const RULES = {
  MIN_PLAYERS: 4, // Permitir 4 para partidas rápidas/pruebas locales (6 es el estándar del GDD)
  MAX_PLAYERS: 14,
  MAX_DMS_PER_DAY: 2,
  SMART_CAM_USES: 2,
  DEEPFAKE_USES: 1,
  DEFENSE_SPEECH_SECONDS: 15,
  INSTANT_VIRAL_THRESHOLD: 3
};
