export const LEARNED_THRESHOLD = 0.7;

export const LEARNING_PATHS = {
  Fundamentos: [
    { id: "fundamentos", label: "Fundamentos · Componentes y JSX", difficulties: ["basico"] }
  ],
  Practica: [
    { id: "practica", label: "Práctica · Hooks y patrones", difficulties: ["intermedio"] }
  ],
  Decisiones: [
    { id: "decisiones", label: "Decisiones · Integraciones y performance", difficulties: ["avanzado"] }
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
