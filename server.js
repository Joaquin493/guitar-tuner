// Servidor mínimo para Render (Web Service).
// Sirve los archivos estáticos compilados por Vite en /dist.
// Render inyecta el puerto en process.env.PORT — NO hardcodear.
import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.static(join(__dirname, "dist")));

// SPA fallback (una sola pantalla)
app.get("*", (_req, res) => {
  res.sendFile(join(__dirname, "dist", "index.html"));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`GuitarTuner Web escuchando en el puerto ${port}`);
});
