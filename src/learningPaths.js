export const LEARNED_THRESHOLD = 0.7;

export const LEARNING_PATHS = {
  Logica: [
    { id: "fundamentos", label: "Paso 1 · Pensamiento lógico", difficulties: ["basico"] },
    { id: "practica", label: "Paso 2 · Retos con condicionales", difficulties: ["intermedio"] },
    { id: "desafio", label: "Paso 3 · Algoritmos prácticos", difficulties: ["avanzado"] }
  ],
  Logica2: [
    { id: "fundamentos", label: "Paso 1 · Puzzles y patrones", difficulties: ["basico"] },
    { id: "practica", label: "Paso 2 · Secuencias complejas", difficulties: ["intermedio"] },
    { id: "desafio", label: "Paso 3 · Lógica avanzada y deducción", difficulties: ["avanzado"] }
  ],
  JavaScript: [
    { id: "fundamentos", label: "Paso 1 · Sintaxis y estructuras base", difficulties: ["basico"] },
    { id: "practica", label: "Paso 2 · DOM y eventos", difficulties: ["intermedio"] },
    { id: "desafio", label: "Paso 3 · Flujo de datos y depuración", difficulties: ["avanzado"] }
  ],
  HTML: [
    { id: "fundamentos", label: "Paso 1 · Etiquetas esenciales", difficulties: ["basico"] },
    { id: "practica", label: "Paso 2 · Formularios y semántica", difficulties: ["intermedio"] },
    { id: "desafio", label: "Paso 3 · Accesibilidad y estructura", difficulties: ["avanzado"] }
  ],
  CSS: [
    { id: "fundamentos", label: "Paso 1 · Selectores y cascada", difficulties: ["basico"] },
    { id: "practica", label: "Paso 2 · Layout con Flex y Grid", difficulties: ["intermedio"] },
    { id: "desafio", label: "Paso 3 · Animaciones y diseño responsivo", difficulties: ["avanzado"] }
  ],
  JavaScript2: [
    { id: "fundamentos", label: "Paso 1 · Arrays y objetos", difficulties: ["basico"] },
    { id: "practica", label: "Paso 2 · Promesas y asincronía", difficulties: ["intermedio"] },
    { id: "desafio", label: "Paso 3 · Patrones de componentes", difficulties: ["avanzado"] }
  ],
  Angular: [
    { id: "fundamentos", label: "Paso 1 · Componentes y templating", difficulties: ["basico"] },
    { id: "practica", label: "Paso 2 · Servicios y routing", difficulties: ["intermedio"] },
    { id: "desafio", label: "Paso 3 · Formularios reactivos y testing", difficulties: ["avanzado"] }
  ],
  API_rest: [
    { id: "fundamentos", label: "Paso 1 · HTTP y verbos básicos", difficulties: ["basico"] },
    { id: "practica", label: "Paso 2 · Consumo de APIs REST y manejo de errores", difficulties: ["intermedio"] },
    { id: "desafio", label: "Paso 3 · Integraciones completas", difficulties: ["avanzado"] }
  ],
  React: [
    { id: "fundamentos", label: "Paso 1 · Componentes y JSX", difficulties: ["basico"] },
    { id: "practica", label: "Paso 2 · Estado, props y hooks", difficulties: ["intermedio"] },
    { id: "desafio", label: "Paso 3 · Integraciones y performance", difficulties: ["avanzado"] }
  ],
  Python: [
    { id: "fundamentos", label: "Paso 1 · Sintaxis y colecciones", difficulties: ["basico"] },
    { id: "practica", label: "Paso 2 · Manejo de archivos y errores", difficulties: ["intermedio"] },
    { id: "desafio", label: "Paso 3 · Scripts y automatización", difficulties: ["avanzado"] }
  ],
  PHP: [
    { id: "fundamentos", label: "Paso 1 · Variables y flujo de control", difficulties: ["basico"] },
    { id: "practica", label: "Paso 2 · Formularios y superglobales", difficulties: ["intermedio"] },
    { id: "desafio", label: "Paso 3 · Integración con bases de datos", difficulties: ["avanzado"] }
  ],
  Java: [
    { id: "fundamentos", label: "Paso 1 · Clases y métodos", difficulties: ["basico"] },
    { id: "practica", label: "Paso 2 · Colecciones y excepciones", difficulties: ["intermedio"] },
    { id: "desafio", label: "Paso 3 · POO avanzada y JDBC", difficulties: ["avanzado"] }
  ],
  Git: [
    { id: "fundamentos", label: "Paso 1 · Flujo Git básico y commits", difficulties: ["basico"] },
    { id: "practica", label: "Paso 2 · Ramas, merges y conflictos", difficulties: ["intermedio"] },
    { id: "desafio", label: "Paso 3 · Colaboración avanzada y buenas prácticas", difficulties: ["avanzado"] }
  ],
  Mysql: [
    { id: "fundamentos", label: "Paso 1 · Consultas básicas", difficulties: ["basico"] },
    { id: "practica", label: "Paso 2 · JOINS y funciones", difficulties: ["intermedio"] },
    { id: "desafio", label: "Paso 3 · Optimización y transacciones", difficulties: ["avanzado"] }
  ],
  Skills: [
    { id: "fundamentos", label: "Paso 1 · Comunicación y feedback", difficulties: ["basico"] },
    { id: "practica", label: "Paso 2 · Trabajo en equipo y foco", difficulties: ["intermedio"] },
    { id: "desafio", label: "Paso 3 · Resolución de conflictos", difficulties: ["avanzado"] }
  ],
  Skills2: [
    { id: "fundamentos", label: "Paso 1 · Autogestión y responsabilidad", difficulties: ["basico"] },
    { id: "practica", label: "Paso 2 · Liderar iniciativas pequeñas", difficulties: ["intermedio"] },
    { id: "desafio", label: "Paso 3 · Mejora continua y mentoring", difficulties: ["avanzado"] }
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
