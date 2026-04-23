const BANK_FILES = import.meta.glob("../preguntas_*.json");

const normalizeCategoryToFileKey = (category) => {
  if (!category) return "";
  return String(category)
    .trim()
    .replace(/[^a-z0-9]+/gi, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
};

const loadBankModule = async (fileKey) => {
  const loader = BANK_FILES[fileKey];
  if (!loader) return [];
  const mod = await loader();
  const data = mod?.default;
  return Array.isArray(data) ? data : [];
};

let totalQuestionsPromise;
let totalQuestionsCount;

export async function loadTotalPreguntasCount() {
  if (!totalQuestionsPromise) {
    totalQuestionsPromise = Promise.all(
      Object.keys(BANK_FILES).map((fileKey) => loadBankModule(fileKey))
    )
      .then((banks) => banks.reduce((acc, bank) => acc + (bank?.length || 0), 0))
      .then((total) => {
        totalQuestionsCount = typeof total === "number" ? total : 0;
        return totalQuestionsCount;
      })
      .catch(() => {
        totalQuestionsCount = 0;
        return 0;
      });
  }
  return totalQuestionsPromise;
}

export const BLOCKS = [
  {
    id: "Fundamentos",
    label: "Fundamentos",
    categorias: [
      { id: "Logica", label: "Lógica", preguntasPorSesion: 50 },
      { id: "Logica2", label: "Lógica 2", preguntasPorSesion: 50 }
    ]
  },
  {
    id: "Frontend",
    label: "Frontend",
    categorias: [
      { id: "JavaScript", label: "JavaScript", preguntasPorSesion: 50 },
      { id: "HTML", label: "HTML", preguntasPorSesion: 50 },
      { id: "CSS", label: "CSS", preguntasPorSesion: 50 },
      { id: "JavaScript2", label: "JavaScript 2", preguntasPorSesion: 50 },
      { id: "Angular", label: "Angular", preguntasPorSesion: 50 },
      { id: "API_rest", label: "API REST", preguntasPorSesion: 50 },
      { id: "React", label: "React", preguntasPorSesion: 50 }
    ]
  },
  {
    id: "Backend",
    label: "Backend",
    categorias: [
      { id: "Python", label: "Python", preguntasPorSesion: 50 },
      { id: "PHP", label: "PHP", preguntasPorSesion: 50 },
      { id: "Java", label: "Java", preguntasPorSesion: 50 }
    ]
  },
  {
    id: "Fullstack",
    label: "Fullstack",
    categorias: [
      { id: "Git", label: "Git", preguntasPorSesion: 50 },
      { id: "Mysql", label: "Mysql", preguntasPorSesion: 50 }
    ]
  },
  {
    id: "Skills",
    label: "Skills",
    categorias: [
      { id: "Skills", label: "Skills", preguntasPorSesion: 50 },
      { id: "Skills2", label: "Skills 2", preguntasPorSesion: 50 }
    ]
  }
];

export const ORDER_BY_PROGRESION = [
  ...BLOCKS.flatMap((block) => block.categorias.map((cat) => cat.id)),
  "General"
];

export const CATEGORY_LIST = BLOCKS.flatMap((block) => block.categorias.map((cat) => cat.id));

export function getBlockForCategory(category) {
  if (!category || category === "Todas") return "Todas";
  const found = BLOCKS.find((block) => block.categorias.some((cat) => cat.id === category));
  return found?.id || "Todas";
}

export function getCategoriasForBlock(blockId) {
  if (!blockId || blockId === "Todas") return [];
  const found = BLOCKS.find((block) => block.id === blockId);
  return found?.categorias || [];
}

export function getPreguntasPorSesion(category) {
  if (!category || category === "Todas") return totalQuestionsCount || 250;
  for (const block of BLOCKS) {
    const found = block.categorias.find((cat) => cat.id === category);
    if (found) return found.preguntasPorSesion;
  }
  return 50;
}

export async function loadPreguntasByCategory(category) {
  if (category === "Todas") {
    const banks = await Promise.all(
      Object.keys(BANK_FILES).map((fileKey) => loadBankModule(fileKey))
    );
    return banks.flat().map((pregunta) => ({ ...pregunta }));
  }

  const normalized = normalizeCategoryToFileKey(category);
  const guessedKey = `../preguntas_${normalized}.json`;

  let bank = await loadBankModule(guessedKey);
  if (!bank.length) {
    const banks = await Promise.all(
      Object.keys(BANK_FILES).map((fileKey) => loadBankModule(fileKey))
    );
    bank = banks.flat();
  }

  return bank
    .filter((pregunta) => pregunta.categoria === category)
    .map((pregunta) => ({ ...pregunta }));
}
