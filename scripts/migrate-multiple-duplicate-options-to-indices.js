const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "src");

function safeParseJson(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

function hasDuplicates(list) {
  if (!Array.isArray(list)) return false;
  const seen = new Set();
  for (const item of list) {
    const key = String(item);
    if (seen.has(key)) return true;
    seen.add(key);
  }
  return false;
}

function normalizeOptionValue(value) {
  return String(value ?? "")
    .trim()
    .replace(/\r\n/g, "\n");
}

function migrateQuestionToIndexAnswers(question) {
  if (!question || typeof question !== "object") return { migrated: false };

  if (question.tipo !== "multiple") return { migrated: false };
  if (!Array.isArray(question.opciones) || question.opciones.length === 0) {
    return { migrated: false };
  }

  if (!Array.isArray(question.respuesta)) return { migrated: false };

  const respuestaEsIndices =
    question.respuesta.length > 0 &&
    question.respuesta.every((item) => Number.isInteger(item));
  if (respuestaEsIndices) return { migrated: false };

  const opciones = question.opciones.map((item) => normalizeOptionValue(item));
  if (!hasDuplicates(opciones)) return { migrated: false };

  const respuestasTexto = question.respuesta.map((item) => normalizeOptionValue(item));

  const indicesPorOpcion = new Map();
  opciones.forEach((opcion, index) => {
    const current = indicesPorOpcion.get(opcion) || [];
    current.push(index);
    indicesPorOpcion.set(opcion, current);
  });

  const neededCounts = new Map();
  respuestasTexto.forEach((respuesta) => {
    neededCounts.set(respuesta, (neededCounts.get(respuesta) || 0) + 1);
  });

  for (const [respuesta, needed] of neededCounts.entries()) {
    const available = indicesPorOpcion.get(respuesta) || [];
    if (available.length < needed) {
      return {
        migrated: false,
        reason: `No hay suficientes opciones duplicadas para mapear '${respuesta}' (${needed} necesarias, ${available.length} disponibles).`
      };
    }
  }

  const indices = [];
  for (const [respuesta, needed] of neededCounts.entries()) {
    const available = indicesPorOpcion.get(respuesta) || [];
    indices.push(...available.slice(0, needed));
  }

  question.respuesta = indices;

  return {
    migrated: true,
    indices
  };
}

function main() {
  const files = fs
    .readdirSync(ROOT)
    .filter((name) => /^preguntas_.*\.json$/i.test(name));

  const report = [];

  files.forEach((file) => {
    const filePath = path.join(ROOT, file);
    const data = safeParseJson(filePath);

    if (!Array.isArray(data)) return;

    let touched = false;

    data.forEach((question) => {
      const result = migrateQuestionToIndexAnswers(question);
      if (result.migrated) {
        touched = true;
        report.push({
          file,
          id: question.id,
          categoria: question.categoria,
          indices: result.indices
        });
      }
    });

    if (touched) {
      fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
    }
  });

  if (!report.length) {
    console.log("No se encontraron preguntas para migrar.");
    return;
  }

  console.log("Migración completada. Preguntas actualizadas:");
  report.forEach((item) => {
    console.log(`- ${item.file} :: ${item.id} (${item.categoria}) -> [${item.indices.join(", ")}]`);
  });
}

main();
