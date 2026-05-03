const BANK_FILES = import.meta.glob("../preguntas_{fundamentos,practica,decisiones}.json");

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
    id: "React",
    label: "React",
    categorias: [
      { id: "Fundamentos", label: "Fundamentos", preguntasPorSesion: 50 },
      { id: "Decisiones", label: "Decisiones", preguntasPorSesion: 50 },
      { id: "Practica", label: "Práctica", preguntasPorSesion: 50 }
    ]
  }
];

export const ORDER_BY_PROGRESION = ["Fundamentos", "Decisiones", "Practica", "General"];

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

  const fileKey = `../preguntas_${String(category || "").toLowerCase()}.json`;

  let bank = await loadBankModule(fileKey);
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
