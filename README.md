# 🛰️ Operación Filtración (Edición 2026)

Juego web multijugador de deducción social y thriller tecnológico contemporáneo (estilo *Mafia* / *Town of Salem* ambientado en el año 2026).

---

## ⚡ Inicio Rápido (Desarrollo)

### 1. Requisitos
- Node.js v18+ (probado con v26)
- npm v9+

### 2. Iniciar Backend y Frontend en simultáneo
```bash
npm run dev
```

Esto levantará automáticamente:
- **Backend (Socket.io & HTTP)**: `http://localhost:4000`
- **Frontend (React + Vite + Tailwind)**: `http://localhost:3000`

---

## 🕹️ Cómo Probar una Partida Localmente

1. Abre tu navegador en [http://localhost:3000](http://localhost:3000).
2. Ingresa tu alias (ej. `Cipher_26`) y presiona **CREAR SALA NUEVA**.
3. Copia el código de 4 letras de la sala (ej. `A8B2`).
4. Abre 3 pestañas adicionales (o ventanas de incógnito) en [http://localhost:3000](http://localhost:3000) e ingresa con otros nombres usando **UNIRSE CON CÓDIGO**.
5. Marca **ESTOY LISTO** en las pestañas.
6. El anfitrión presiona **INICIAR PARTIDA**.

---

## 📱 Mecánicas Principales

- **Dashboard / Smartphone OS 2026**: Estética *glassmorphism* oscuro, barra de estado con cifrado SHA-256 y dock inferior de aplicaciones.
- **Canales de Mensajería Encriptada**:
  - `Red Abierta`: Chat público diurno (se desactiva de noche).
  - `Cártel Privado`: Canal exclusivo y cifrado para los miembros de la mafia durante la noche.
  - `DMs Cifrados`: 2 Mensajes Directos por jugador al día. Al enviar uno, el sistema emite una alerta pública: `🔔 [Jugador A] envió un mensaje encriptado a [Jugador B]` (sin mostrar el contenido).
- **Tendencias del Día (Día 2+)**:
  - `Caída de Servidores (Cloud Outage)`: Votos del juicio 100% anónimos.
  - `Filtración de Chats (Data Leak)`: Se publica en el boletín matutino un mensaje real enviado por la mafia.
  - `Verificación 2FA`: La opción de abstención queda bloqueada en el tribunal.
  - `Viralización Instantánea`: 3 acusaciones suben inmediatamente al sospechoso al estrado.
- **Resolución Nocturna Autoritativa (5 Pasos de Prioridad)**:
  1. Bloqueos de red (Hacker DDoS)
  2. Alteraciones de identidad (Deepfakes)
  3. Protección médica (Paramédico)
  4. Ataque letal del Cártel (CEO / Capo)
  5. Recolección de inteligencia (OSINT, Periodista, Smart-Cam)
