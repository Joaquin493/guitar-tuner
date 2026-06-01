import { TUNINGS, DEFAULT_TUNING } from "./core/strings.js";
import { analyze } from "./core/notes.js";
import { Smoother } from "./core/smoother.js";
import { PitchDetector } from "./audio/PitchDetector.js";
import { ReferenceTone } from "./audio/ReferenceTone.js";
import { createCentsMeter } from "./ui/CentsMeter.js";
import { createWaveform } from "./ui/Waveform.js";
import { createStringSelector } from "./ui/StringSelector.js";

const els = {
  statusPill: document.getElementById("status-pill"),
  card: document.getElementById("meter-card"),
  noteName: document.getElementById("note-name"),
  noteOctave: document.getElementById("note-octave"),
  frequency: document.getElementById("frequency"),
  gauge: document.getElementById("gauge"),
  badge: document.getElementById("status-badge"),
  micButton: document.getElementById("mic-button"),
  refPitch: document.getElementById("ref-pitch"),
  refValue: document.getElementById("ref-value"),
  waveform: document.getElementById("waveform"),
  stringSelector: document.getElementById("string-selector"),
  tuningSelect: document.getElementById("tuning-select"),
};

const meter = createCentsMeter(els.gauge);
const waveform = createWaveform(els.waveform);
const detector = new PitchDetector();
const tone = new ReferenceTone();
const smoother = new Smoother(5);

// --- Preferencias persistentes (localStorage) --------------------------------
const STORE = { tuning: "gt_tuning", ref: "gt_ref", mode: "gt_mode" };
const load = (k) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
const save = (k, v) => {
  try {
    localStorage.setItem(k, v);
  } catch {
    /* modo privado / sin acceso */
  }
};

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

// --- Modo Guitarra / Cromático -----------------------------------------------
const appEl = document.querySelector(".app");
const modeButtons = document.querySelectorAll("#mode-toggle .mode-btn");

function setMode(mode) {
  const chromatic = mode === "chromatic";
  appEl.classList.toggle("chromatic", chromatic);
  modeButtons.forEach((b) => b.classList.toggle("active", b.dataset.mode === mode));
  save(STORE.mode, mode);
}
modeButtons.forEach((b) =>
  b.addEventListener("click", () => setMode(b.dataset.mode))
);
setMode(load(STORE.mode) === "chromatic" ? "chromatic" : "guitar");

// --- Selector de afinación ---------------------------------------------------
const playReference = (s) => tone.play(s.hz);

const savedTuning = load(STORE.tuning);
const initialTuning = TUNINGS[savedTuning] ? savedTuning : DEFAULT_TUNING;

let currentStrings = TUNINGS[initialTuning];
let selector = createStringSelector(els.stringSelector, currentStrings, playReference);

for (const name of Object.keys(TUNINGS)) {
  const opt = document.createElement("option");
  opt.value = name;
  opt.textContent = name;
  els.tuningSelect.appendChild(opt);
}
els.tuningSelect.value = initialTuning;

els.tuningSelect.addEventListener("change", () => {
  currentStrings = TUNINGS[els.tuningSelect.value];
  selector = createStringSelector(els.stringSelector, currentStrings, playReference);
  smoother.reset();
  save(STORE.tuning, els.tuningSelect.value);
});

// --- Referencia A4 -----------------------------------------------------------
const savedRef = Number(load(STORE.ref));
if (savedRef >= 432 && savedRef <= 446) {
  referencePitch = savedRef;
  els.refPitch.value = String(savedRef);
  els.refValue.textContent = savedRef + " Hz";
}

els.refPitch.addEventListener("input", () => {
  referencePitch = Number(els.refPitch.value);
  els.refValue.textContent = referencePitch + " Hz";
  save(STORE.ref, els.refPitch.value);
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
  els.card.dataset.status = "silent";
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
  els.card.dataset.status = r.status;
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
