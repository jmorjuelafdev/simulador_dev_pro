const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

function normalizar(str = "") {
  return String(str ?? "").replace(/\s+/g, "").toLowerCase();
}

app.post("/evaluar", (req, res) => {
  const { respuestaUsuario = "", pregunta = {} } = req.body || {};

  const solucionReferencial = pregunta.respuesta ?? pregunta.solucion ?? "";
  const respuestaNormalizada = normalizar(respuestaUsuario);
  const solucionNormalizada = normalizar(solucionReferencial);

  const correcta = respuestaNormalizada.length > 0 && solucionNormalizada.length > 0 && respuestaNormalizada === solucionNormalizada;

  if (correcta) {
    return res.json({
      correcta: true,
      mensaje: "✅ Correcto"
    });
  }

  return res.json({
    correcta: false,
    mensaje: "❌ Incorrecto",
    solucion: solucionReferencial,
    explicacion: pregunta.explicacion ?? "Esta es la solución correcta al problema planteado."
  });
});

app.get("/ping", (_req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Servidor de evaluación corriendo en http://localhost:${PORT}`);
});
