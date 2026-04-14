export function barajar(lista) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

export function descomponerPlantillaCodigo(plantilla = "") {
  const partes = [];
  if (!plantilla || typeof plantilla !== "string") {
    return partes;
  }

  const regex = /\{\{slot(\d+)\}\}/g;
  let cursor = 0;
  let match;

  while ((match = regex.exec(plantilla))) {
    if (match.index > cursor) {
      partes.push({ tipo: "texto", valor: plantilla.slice(cursor, match.index) });
    }

    partes.push({ tipo: "slot", indice: Number(match[1]) });
    cursor = match.index + match[0].length;
  }

  if (cursor < plantilla.length) {
    partes.push({ tipo: "texto", valor: plantilla.slice(cursor) });
  }

  return partes;
}

export function completarPlantillaCodigo(plantilla = "", respuestas = []) {
  if (!plantilla) return "";
  return plantilla.replace(/\{\{slot(\d+)\}\}/g, (_match, index) => {
    const posicion = Number(index);
    const valor = respuestas[posicion];
    return typeof valor === "string" ? valor : `{{slot${posicion}}}`;
  });
}

export function cryptoId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function construirJustificacion(pregunta, fueCorrecta) {
  if (!pregunta) return "";
  const respuesta = pregunta.respuesta ? `"${pregunta.respuesta}"` : "la solucion propuesta";
  const base =
    pregunta.justificacion ||
    pregunta.descripcion ||
    (fueCorrecta ? pregunta.feedbackExito : pregunta.feedbackError);

  if (base) {
    if (fueCorrecta) return base;
    return `La respuesta correcta era ${respuesta}. ${base}`.trim();
  }

  if (pregunta.tipo === "codigo") {
    return fueCorrecta
      ? "El codigo supero todas las validaciones definidas para la ejercitacion."
      : "El codigo debe satisfacer todas las validaciones automaticas (regex/inclusiones) para aprobar.";
  }

  const categoria = pregunta.categoria ? pregunta.categoria.toLowerCase() : "la consigna";
  if (fueCorrecta) {
    return `La opcion ${respuesta} es la que mejor se alinea con los principios de ${categoria}.`;
  }
  return `La respuesta correcta era ${respuesta} porque resume el concepto clave exigido en ${categoria}.`;
}
