# Roadmap — Guitar Tuner Web

Estado de las features futuras. Orden aproximado por relación impacto/esfuerzo.

## ✅ Hechas
- [x] **Suavizado de lectura (filtro de mediana)** — estabiliza la aguja y
  reduce saltos de octava por ruido/armónicos. (`src/core/smoother.js`)
- [x] **Afinaciones alternativas** — Estándar, Drop D, Medio tono abajo (Eb),
  Open G, DADGAD. Selector en la UI. (`src/core/strings.js`)
- [x] **Feedback háptico al afinar** — `navigator.vibrate` al entrar en afinado
  (en móviles que lo soporten).

## 🔜 Próximas (fáciles)
- [ ] **Modo cromático explícito (toggle)** — botón "Cromático / Guitarra" que
  oculte el selector de cuerdas. El motor ya detecta nota libre.
- [ ] **Tono de referencia reproducible** — botón por cuerda que suene su Hz
  objetivo con un `OscillatorNode` (afinación de oído). Reusar el `AudioContext`.
- [ ] **Persistir preferencias** — guardar afinación elegida y referencia A4 en
  `localStorage`.

## 🎨 UI / look & feel
- [ ] **Pulir el front-end para que se vea como una app actual** — elevar el
  diseño del estado funcional actual a una UI moderna y pulida:
  - Medidor circular/arco tipo afinador profesional (en vez de barra lineal),
    con animación fluida de la aguja.
  - Transiciones y micro-interacciones (estados de botón, entrada de nota,
    pulso al afinar).
  - Tipografía cuidada (fuente custom para la nota), jerarquía y espaciado.
  - Glow/feedback de color más rico al afinar; modo claro/oscuro.
  - Responsive real (tablet/desktop) y safe-areas en iOS (notch).
  - Ícono de app + splash para la versión PWA.
  - Considerar un set de componentes/animaciones (CSS puro o una lib liviana).

## 🛠️ Medio esfuerzo
- [ ] **Detección de octava más robusta (HPS)** — evita que la autocorrelación
  enganche un armónico; mejora la cuerda 6 (E2). Va en `src/audio/`.
- [ ] **PWA instalable + offline** — `manifest.json` + service worker. Permite
  "instalar" en el iPhone desde Safari y usar sin conexión.
- [ ] **Historial / gráfico de estabilidad** — mini-canvas con los últimos
  segundos de cents para ver si la cuerda se va tras afinar.

## 🚀 Ambiciosas
- [ ] **AudioWorklet** — mover la autocorrelación fuera del hilo principal para
  UI más fluida y análisis más frecuente. Refactor de `autocorrelate.js` +
  `PitchDetector.js`.
- [ ] **Multi-instrumento** — bajo, ukelele, violín, etc. Solo cambia el set de
  cuerdas y el rango `MIN_HZ/MAX_HZ` en `PitchDetector.js`.
