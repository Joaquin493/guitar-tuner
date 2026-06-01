import { TUNINGS, DEFAULT_TUNING } from "./core/strings.js";
import { analyze } from "./core/notes.js";
import { Smoother } from "./core/smoother.js";
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
  tuningSelect: document.getElementById("tuning-select"),
};

const meter = createCentsMeter(els.needle);
const waveform = createWaveform(els.waveform);
const detector = new PitchDetector();
const smoother = new Smoother(5);

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
let lastStatus = "silent";

// --- Selector de afinación ---------------------------------------------------
let currentStrings = TUNINGS[DEFAULT_TUNING];
let selector = createStringSelector(els.stringSelector, currentStrings);

for (const name of Object.keys(TUNINGS)) {
  const opt = document.createElement("option");
  opt.value = name;
  opt.textContent = name;
  els.tuningSelect.appendChild(opt);
}
els.tuningSelect.value = DEFAULT_TUNING;

els.tuningSelect.addEventListener("change", () => {
  currentStrings = TUNINGS[els.tuningSelect.value];
  selector = createStringSelector(els.stringSelector, currentStrings);
  smoother.reset();
});

// --- Referencia A4 -----------------------------------------------------------
els.refPitch.addEventListener("input", () => {
  referencePitch = Number(els.refPitch.value);
  els.refValue.textContent = referencePitch + " Hz";
});

// --- Micrófono ---------------------------------------------------------------
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
  smoother.reset();
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
  lastStatus = "silent";
}

function render(r) {
  els.noteName.textContent = r.noteName;
  els.noteOctave.textContent = r.octave;
  els.frequency.textContent = r.frequency.toFixed(1) + " Hz";
  els.badge.textContent = STATUS_TEXT[r.status];
  els.badge.className = "status-badge " + r.status;
  meter.update(r.cents, r.status);
  selector.highlight(r.noteName, r.octave);

  // Feedback háptico al entrar en afinado (móviles que lo soporten).
  if (r.status === "inTune" && lastStatus !== "inTune") {
    navigator.vibrate?.(60);
  }
  lastStatus = r.status;
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
      const smoothed = smoother.push(frequency);
      render(analyze(smoothed, referencePitch));
    } else if (now - lastSoundTime > SILENCE_RESET_MS) {
      smoother.reset();
      showSilent();
    }
  }
  waveform.update(currentLevel, true);
}

showSilent();
requestAnimationFrame(loop);
