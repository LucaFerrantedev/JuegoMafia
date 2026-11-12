export type DailyTrendId =
  | 'CLOUD_OUTAGE'
  | 'CHAT_LEAKS'
  | 'TWO_FACTOR_REQUIRED'
  | 'INSTANT_VIRAL';

export interface DailyTrendDefinition {
  id: DailyTrendId;
  title: string;
  subtitle: string;
  description: string;
  iconName: string;
}

export const DAILY_TRENDS: Record<DailyTrendId, DailyTrendDefinition> = {
  CLOUD_OUTAGE: {
    id: 'CLOUD_OUTAGE',
    title: 'Caída de Servidores (Cloud Outage)',
    subtitle: 'Falla parcial en el clúster de autenticación',
    description: 'Durante el juicio de hoy, los votos son 100% anónimos. Solo se mostrará el recuento total acumulado.',
    iconName: 'ServerCrash'
  },
  CHAT_LEAKS: {
    id: 'CHAT_LEAKS',
    title: 'Filtración de Chats (Data Leak)',
    subtitle: 'Interceptación de paquetes de red',
    description: 'Se ha filtrado en el boletín matutino un mensaje verídico enviado durante la noche por el canal encriptado del Cártel.',
    iconName: 'ShieldAlert'
  },
  TWO_FACTOR_REQUIRED: {
    id: 'TWO_FACTOR_REQUIRED',
    title: 'Verificación Obligatoria 2FA',
    subtitle: 'Autenticación biométrica forzada',
    description: 'La opción de "Abstención" ha sido revocada en el estrado. Todos los ciudadanos vivos deben declarar Culpable o Inocente.',
    iconName: 'KeyRound'
  },
  INSTANT_VIRAL: {
    id: 'INSTANT_VIRAL',
    title: 'Viralización Instantánea',
    subtitle: 'Tendencia descontrolada en redes sociales',
    description: 'El primer sospechoso que acumule 3 acusaciones subirá inmediatamente al estrado de defensa sin esperar al temporizador.',
    iconName: 'Radio'
  }
};
