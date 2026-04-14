export const LEARNED_THRESHOLD = 0.7;

export const LEARNING_PATHS = {
  "Logica": [
    { id: "fundamentos", label: "Paso 1 · Pensamiento lógico", difficulties: ["basico"] },
    { id: "practica", label: "Paso 2 · Retos con condicionales", difficulties: ["intermedio"] },
    { id: "desafio", label: "Paso 3 · Algoritmos prácticos", difficulties: ["avanzado"] }
  ],
  "JavaScript": [
    { id: "fundamentos", label: "Paso 1 · Fundamentos clave", difficulties: ["basico"] },
    { id: "practica", label: "Paso 2 · Práctica guiada", difficulties: ["intermedio"] },
    { id: "desafio", label: "Paso 3 · Desafío final", difficulties: ["avanzado"] }
  ],
  "Python": [
    { id: "fundamentos", label: "Paso 1 · Fundamentos clave", difficulties: ["basico"] },
    { id: "practica", label: "Paso 2 · Práctica guiada", difficulties: ["intermedio"] },
    { id: "desafio", label: "Paso 3 · Desafío final", difficulties: ["avanzado"] }
  ],
  "Fullstack": [
    { id: "fundamentos", label: "Paso 1 · Integración frontend y lógica", difficulties: ["basico"] },
    { id: "practica", label: "Paso 2 · APIs y validaciones", difficulties: ["intermedio"] },
    { id: "desafio", label: "Paso 3 · Deploy y monitoreo", difficulties: ["avanzado"] }
  ],
  "Skills": [
    { id: "fundamentos", label: "Paso 1 · Fundamentos clave", difficulties: ["basico"] },
    { id: "practica", label: "Paso 2 · Práctica guiada", difficulties: ["intermedio"] },
    { id: "desafio", label: "Paso 3 · Desafío final", difficulties: ["avanzado"] }
  ]
};

export function getTopicForQuestion(pregunta) {
  if (!pregunta?.categoria) return null;
  const topics = LEARNING_PATHS[pregunta.categoria];
  if (!topics?.length) return null;
  if (pregunta.tema) {
    const direct = topics.find((topic) => topic.id === pregunta.tema);
    if (direct) return { categoria: pregunta.categoria, topicId: direct.id };
  }
  const difficulty = (pregunta.dificultad || "facil").toLowerCase();
  const match = topics.find((topic) => topic.difficulties?.includes(difficulty));
  return { categoria: pregunta.categoria, topicId: match ? match.id : topics[0].id };
}
