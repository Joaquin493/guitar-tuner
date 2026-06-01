import { STANDARD_TUNING } from "./core/strings.js";
import { analyze } from "./core/notes.js";
import { PitchDetector } from "./audio/PitchDetector.js";
import { createCentsMeter } from "./ui/CentsMeter.js";
import { createWaveform } from "./ui/Waveform.js";
import { createStringSelector } from "./ui/StringSelector.js";

const els = {
  statusPill: document.getElementById("status-pill"),
  noteName: document.getElementById("note-name"),
  noteOctave: document.getElementById("note-octave"),
  frequency: document.getElementById("frequency"),
  needle: document.getElementById("needle"),
  badge: document.getElementById("status-badge"),
  micButton: document.getElementById("mic-button"),
  refPitch: document.getElementById("ref-pitch"),
  refValue: document.getElementById("ref-value"),
  waveform: document.getElementById("waveform"),
  stringSelector: document.getElementById("string-selector"),
};

const meter = createCentsMeter(els.needle);
const waveform = createWaveform(els.waveform);
const selector = createStringSelector(els.stringSelector, STANDARD_TUNING);
const detector = new PitchDetector();

const STATUS_TEXT = {
  inTune: "Afinado ✓",
  close: "Casi…",
  flat: "Baja ↓",
  sharp: "Alta ↑",
  silent: "Esperando…",
};

const SILENCE_RESET_MS = 1500; // resetea a "silencio" tras 1.5 s sin señal
const ANALYSIS_INTERVAL_MS = 50; // analiza ~20 veces/s (la UI anima a 60fps)

let referencePitch = 440;
let listening = false;
let lastSoundTime = 0;
let lastAnalysis = 0;
let currentLevel = 0;

els.refPitch.addEventListener("input", () => {
  referencePitch = Number(els.refPitch.value);
  els.refValue.textContent = referencePitch + " Hz";
});

els.micButton.addEventListener("click", async () => {
  if (listening) {
    stopListening();
    return;
  }
  try {
    await detector.start();
    listening = true;
    lastSoundTime = performance.now();
    els.micButton.textContent = "Apagar micrófono";
    els.micButton.classList.add("active");
    els.statusPill.textContent = "Escuchando…";
    els.statusPill.classList.add("on");
  } catch (err) {
    console.error(err);
    els.statusPill.textContent =
      err && err.name === "NotAllowedError"
        ? "Permiso de micrófono denegado"
        : "No se pudo acceder al micrófono";
  }
});

function stopListening() {
  detector.stop();
  listening = false;
  els.micButton.textContent = "Encender micrófono";
  els.micButton.classList.remove("active");
  els.statusPill.textContent = "Micrófono apagado";
  els.statusPill.classList.remove("on");
  showSilent();
  waveform.update(0, false);
}

function showSilent() {
  els.noteName.textContent = "–";
  els.noteOctave.textContent = "";
  els.frequency.textContent = "0.0 Hz";
  els.badge.textContent = STATUS_TEXT.silent;
  els.badge.className = "status-badge silent";
  meter.update(0, "silent");
  selector.highlight(null, null);
}

function render(r) {
  els.noteName.textContent = r.noteName;
  els.noteOctave.textContent = r.octave;
  els.frequency.textContent = r.frequency.toFixed(1) + " Hz";
  els.badge.textContent = STATUS_TEXT[r.status];
  els.badge.className = "status-badge " + r.status;
  meter.update(r.cents, r.status);
  selector.highlight(r.noteName, r.octave);
}

function loop(now) {
  requestAnimationFrame(loop);
  if (!listening) return;

  if (now - lastAnalysis > ANALYSIS_INTERVAL_MS) {
    lastAnalysis = now;
    const { frequency, level } = detector.read();
    currentLevel = level;
    if (frequency) {
      lastSoundTime = now;
      render(analyze(frequency, referencePitch));
    } else if (now - lastSoundTime > SILENCE_RESET_MS) {
      showSilent();
    }
  }
  waveform.update(currentLevel, true);
}

showSilent();
requestAnimationFrame(loop);
