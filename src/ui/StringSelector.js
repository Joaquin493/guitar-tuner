// Botones de las 6 cuerdas. Resalta la cuerda cuya nota+octava coincide
// con lo que se está detectando (modo cromático automático).
// Al tocar un botón, dispara `onPlay(string)` (tono de referencia).
export function createStringSelector(container, strings, onPlay) {
  container.innerHTML = ""; // permite reconstruir al cambiar de afinación
  const buttons = strings.map((s) => {
    const btn = document.createElement("button");
    btn.className = "string-btn";
    btn.innerHTML = `<span class="s-note">${s.note}</span><span class="s-num">cuerda ${s.number}</span>`;
    if (onPlay) {
      btn.addEventListener("click", () => {
        onPlay(s);
        btn.classList.add("playing");
        setTimeout(() => btn.classList.remove("playing"), 1400);
      });
    }
    container.appendChild(btn);
    return btn;
  });

  return {
    highlight(noteName, octave) {
      buttons.forEach((btn, i) => {
        const s = strings[i];
        const match = s.note === noteName && s.octave === octave;
        btn.classList.toggle("active", match);
      });
    },
  };
}
