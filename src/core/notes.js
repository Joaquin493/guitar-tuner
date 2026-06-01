// Lógica pura: Hz -> nota / octava / cents / estado de afinación.
// Sin dependencias de DOM ni audio (fácil de testear).

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const SILENT = { frequency: 0, noteName: "–", octave: 0, cents: 0, status: "silent" };

/**
 * @param {number|null} frequency  Hz detectados (null/0 = silencio)
 * @param {number} referencePitch  A4 de referencia (432–446, default 440)
 */
export function analyze(frequency, referencePitch = 440) {
  if (!frequency || frequency <= 0) return { ...SILENT };

  const midiFloat = 12 * Math.log2(frequency / referencePitch) + 69;
  const midi = Math.round(midiFloat);
  const noteName = NOTE_NAMES[((midi % 12) + 12) % 12];
  const octave = Math.floor(midi / 12) - 1;
  const cents = Math.round((midiFloat - midi) * 100);

  let status;
  const abs = Math.abs(cents);
  if (abs <= 5) status = "inTune";
  else if (abs <= 15) status = "close";
  else if (cents < 0) status = "flat";
  else status = "sharp";

  return { frequency, noteName, octave, cents, status };
}
