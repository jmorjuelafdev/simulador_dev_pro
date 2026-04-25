const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "src");
const FILES = [
  "preguntas_git.json",
  "preguntas_javascript.json",
  "preguntas_logica.json",
  "preguntas_react.json",
  "preguntas_python.json",
  "preguntas_skills.json",
  "preguntas_skills2.json"
];

const KEY_ORDER = [
  "id",
  "categoria",
  "tipo",
  "dificultad",
  "pregunta",
  "codigo",
  "modo",
  "plantilla",
  "opciones",
  "opcionesSlots",
  "opcionesArrastrar",
  "respuestas",
  "respuesta",
  "respuestasSlots",
  "respuestaCorrecta",
  "evaluacion",
  "feedbackExito",
  "feedbackError",
  "justificacion",
  "descripcion",
  "hints",
  "puntos",
  "timeLimit"
];

function cleanValue(value) {
  if (Array.isArray(value)) {
    return value.map((item) => cleanValue(item));
  }
  if (value && typeof value === "object") {
    const cleaned = {};
    Object.keys(value)
      .sort((a, b) => a.localeCompare(b))
      .forEach((key) => {
        cleaned[key] = cleanValue(value[key]);
      });
    return cleaned;
  }
  if (typeof value === "string") {
    return value.replace(/\r\n/g, "\n").trim();
  }
  return value;
}

function normalizeQuestion(question) {
  const working = { ...question };

  if (
    Object.prototype.hasOwnProperty.call(working, "respuestaCorrecta") &&
    !Object.prototype.hasOwnProperty.call(working, "respuesta")
  ) {
    working.respuesta = working.respuestaCorrecta;
  }

  delete working.respuestaCorrecta;

  const cleanedQuestion = {};

  KEY_ORDER.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(working, key)) {
      cleanedQuestion[key] = cleanValue(working[key]);
      delete working[key];
    }
  });

  const remainingKeys = Object.keys(working).sort((a, b) => a.localeCompare(b));

  remainingKeys.forEach((key) => {
    cleanedQuestion[key] = cleanValue(working[key]);
  });

  return cleanedQuestion;
}

FILES.forEach((file) => {
  const filePath = path.join(ROOT, file);
  const raw = fs.readFileSync(filePath, "utf8");
  const data = JSON.parse(raw);
  const normalized = data.map(normalizeQuestion);
  const serialized = `${JSON.stringify(normalized, null, 2)}\n`;
  fs.writeFileSync(filePath, serialized, "utf8");
  console.log(`Normalizado ${file}`);
});
