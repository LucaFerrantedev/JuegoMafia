import { DailyTrendId } from '@operacion-filtracion/shared';

const TREND_LIST: DailyTrendId[] = [
  'CLOUD_OUTAGE',
  'CHAT_LEAKS',
  'TWO_FACTOR_REQUIRED',
  'INSTANT_VIRAL'
];

export function selectDailyTrend(roundNumber: number): DailyTrendId | undefined {
  // Solo se activa a partir del Día 2
  if (roundNumber < 2) return undefined;

  // 80% de probabilidad de tener tendencia activa a partir del día 2
  if (Math.random() > 0.8) return undefined;

  const randomIndex = Math.floor(Math.random() * TREND_LIST.length);
  return TREND_LIST[randomIndex];
}
