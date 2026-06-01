# Guitar Tuner Web

Afinador de guitarra en el navegador. Escucha el micrófono en tiempo real,
detecta la frecuencia por **autocorrelación** y muestra nota, octava y
desviación en *cents*. Port web de la app iOS (SwiftUI + AVAudioEngine).

- **Sin backend de datos** — todo el audio se procesa en el cliente.
- **Sin dependencias de runtime** salvo Express (solo para servir en Render).
- Stack: HTML + CSS + JavaScript (vanilla) + Vite. Express para el deploy.

## Requisitos

- Node 18+
- El micrófono **exige contexto seguro**: funciona en `localhost` y en HTTPS
  (Render da HTTPS automático). No funciona sobre `http://` en una IP de red.

## Desarrollo local

```bash
npm install
npm run dev
```

Abrí la URL que imprime Vite (http://localhost:5173). Hacé click en
**Encender micrófono** y aceptá el permiso.

## Build + servir como en producción

```bash
npm run build      # genera /dist
npm start          # sirve /dist con Express en el puerto $PORT (default 3000)
```

## Deploy en Render

### Opción A — Static Site (más simple)
- Build command: `npm install && npm run build`
- Publish directory: `dist`

### Opción B — Web Service (con Express, incluido)
- Build command: `npm install && npm run build`
- Start command: `node server.js`
- Render inyecta `PORT` automáticamente (ya está contemplado en `server.js`).

El archivo `render.yaml` permite crear el servicio (Opción B) directamente
conectando el repo.

## Estructura

```
src/
├── main.js              # orquesta UI + audio (loop con requestAnimationFrame)
├── style.css            # tema oscuro + dorado
├── core/
│   ├── notes.js         # Hz -> nota/octava/cents/estado (lógica pura)
│   └── strings.js       # frecuencias de las 6 cuerdas (afinación estándar E)
├── audio/
│   ├── PitchDetector.js # getUserMedia + Web Audio + gate de silencio
│   └── autocorrelate.js # estimación de frecuencia (ACF2+)
└── ui/
    ├── CentsMeter.js    # aguja -50…+50 cents
    ├── Waveform.js      # barras ligadas al nivel de audio real
    └── StringSelector.js# resalta la cuerda detectada
```

## Notas técnicas

- `AudioContext` arranca suspendido: se reanuda con el click del botón (gesto
  de usuario requerido por los navegadores).
- Se usa el `sampleRate` real del `AudioContext` (44100 o 48000 según el equipo).
- El análisis corre ~20 veces/s; la UI anima a 60fps.
- En iOS Safari puede hacer falta volver a tocar el botón tras volver del
  segundo plano para reanudar el audio.
```
