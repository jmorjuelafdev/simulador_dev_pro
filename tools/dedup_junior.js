const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "..", "src", "preguntas_junior.json");
const raw = fs.readFileSync(filePath, "utf8");
const data = JSON.parse(raw);

const normalizeQuestion = (question = "") => {
  const trimmed = question.trim().toLowerCase();
  const colonIndex = trimmed.indexOf(":");
  const withoutPrefix = colonIndex >= 0 ? trimmed.slice(colonIndex + 1).trim() : trimmed;
  return withoutPrefix.replace(/\s+/g, " ");
};

const seen = new Map();
const result = [];

data.forEach((item) => {
  if (!item || typeof item !== "object") return;
  const categoria = item.categoria || "General";
  const pregunta = normalizeQuestion(item.pregunta || "");
  const key = `${categoria}|${pregunta}`;
  const score = (item.id ? 10 : 0) + (item.dificultad ? 3 : 0) + (item.codigo ? 2 : 0) + (Array.isArray(item.hints) && item.hints.length ? 1 : 0);
  const current = seen.get(key);
  if (!current) {
    seen.set(key, { index: result.length, score });
    result.push(item);
    return;
  }
  if (score > current.score) {
    result[current.index] = item;
    seen.set(key, { index: current.index, score });
  }
});

fs.writeFileSync(filePath, JSON.stringify(result, null, 2));
console.log(`Preguntas originales: ${data.length}`);
console.log(`Preguntas tras depurar duplicados: ${result.length}`);
