// Afinaciones. Cada una lista las 6 cuerdas de la más gruesa (índice 0) a la
// más fina. Los nombres de nota usan sostenidos (C#, D#, …) para coincidir con
// la detección cromática de notes.js (que produce sostenidos).

export const TUNINGS = {
  "Estándar (E)": [
    { number: 6, note: "E", octave: 2, hz: 82.41 },
    { number: 5, note: "A", octave: 2, hz: 110.0 },
    { number: 4, note: "D", octave: 3, hz: 146.83 },
    { number: 3, note: "G", octave: 3, hz: 196.0 },
    { number: 2, note: "B", octave: 3, hz: 246.94 },
    { number: 1, note: "E", octave: 4, hz: 329.63 },
  ],
  "Drop D": [
    { number: 6, note: "D", octave: 2, hz: 73.42 },
    { number: 5, note: "A", octave: 2, hz: 110.0 },
    { number: 4, note: "D", octave: 3, hz: 146.83 },
    { number: 3, note: "G", octave: 3, hz: 196.0 },
    { number: 2, note: "B", octave: 3, hz: 246.94 },
    { number: 1, note: "E", octave: 4, hz: 329.63 },
  ],
  "Medio tono abajo (Eb)": [
    { number: 6, note: "D#", octave: 2, hz: 77.78 },
    { number: 5, note: "G#", octave: 2, hz: 103.83 },
    { number: 4, note: "C#", octave: 3, hz: 138.59 },
    { number: 3, note: "F#", octave: 3, hz: 185.0 },
    { number: 2, note: "A#", octave: 3, hz: 233.08 },
    { number: 1, note: "D#", octave: 4, hz: 311.13 },
  ],
  "Open G": [
    { number: 6, note: "D", octave: 2, hz: 73.42 },
    { number: 5, note: "G", octave: 2, hz: 98.0 },
    { number: 4, note: "D", octave: 3, hz: 146.83 },
    { number: 3, note: "G", octave: 3, hz: 196.0 },
    { number: 2, note: "B", octave: 3, hz: 246.94 },
    { number: 1, note: "D", octave: 4, hz: 293.66 },
  ],
  DADGAD: [
    { number: 6, note: "D", octave: 2, hz: 73.42 },
    { number: 5, note: "A", octave: 2, hz: 110.0 },
    { number: 4, note: "D", octave: 3, hz: 146.83 },
    { number: 3, note: "G", octave: 3, hz: 196.0 },
    { number: 2, note: "A", octave: 3, hz: 220.0 },
    { number: 1, note: "D", octave: 4, hz: 293.66 },
  ],
};

export const DEFAULT_TUNING = "Estándar (E)";

// Compatibilidad: afinación estándar como export directo.
export const STANDARD_TUNING = TUNINGS[DEFAULT_TUNING];
