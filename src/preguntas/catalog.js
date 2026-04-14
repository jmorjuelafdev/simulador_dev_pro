import logicaRaw from "../preguntas_logica.json";
import javascriptRaw from "../preguntas_javascript.json";
import pythonRaw from "../preguntas_python.json";
import fullstackRaw from "../preguntas_fullstack.json";
import skillsRaw from "../preguntas_skills.json";

const TODO_EL_BANCO = [
  ...logicaRaw,
  ...javascriptRaw,
  ...pythonRaw,
  ...fullstackRaw,
  ...skillsRaw
];

export const ORDER_BY_PROGRESION = [
  "Logica",
  "JavaScript",
  "Python",
  "Fullstack",
  "Skills",
  "General"
];

export const CATEGORY_LIST = Array.from(
  new Set(TODO_EL_BANCO.map((pregunta) => pregunta.categoria || "General"))
).sort((a, b) => {
  const indexA = ORDER_BY_PROGRESION.indexOf(a);
  const indexB = ORDER_BY_PROGRESION.indexOf(b);
  if (indexA === -1 && indexB === -1) {
    return a.localeCompare(b, "es", { sensitivity: "base" });
  }
  if (indexA === -1) return 1;
  if (indexB === -1) return -1;
  return indexA - indexB;
});

export async function loadPreguntasByCategory(category) {
  if (category === "Todas") {
    return TODO_EL_BANCO.map((pregunta) => ({ ...pregunta }));
  }
  return TODO_EL_BANCO.filter((pregunta) => pregunta.categoria === category).map(
    (pregunta) => ({ ...pregunta })
  );
}
