import { useCallback, useEffect, useMemo, useState } from "react";
import { barajar, completarPlantillaCodigo, descomponerPlantillaCodigo } from "../utils/quiz";

const assetImages = import.meta.glob("../assets/img/*", {
  eager: true,
  import: "default"
});

function resolveHtmlAssetUrls(html = "") {
  if (!html || typeof html !== "string") return "";

  return html.replace(/\s(src)\s*=\s*(["'])([^"']+)(\2)/gi, (match, attr, quote, value) => {
    if (!value) return match;
    if (/^(https?:)?\/\//i.test(value) || value.startsWith("data:") || value.startsWith("/")) {
      return match;
    }

    const normalized = value.replace(/^\.\//, "");
    const fileName = normalized.split("/").pop();
    if (!fileName) return match;

    const entry = Object.entries(assetImages).find(([key]) => key.split("/").pop() === fileName);
    if (!entry) return match;

    const resolvedUrl = entry[1];
    return ` ${attr}=${quote}${resolvedUrl}${quote}`;
  });
}

function CodeSlotQuestion({ pregunta, respuestaActual, onResponder, disabled }) {
  const {
    plantilla = "",
    opcionesSlots = [],
    opcionesArrastrar = [],
    respuestasSlots = [],
    hints = []
  } = pregunta;

  const rawOptions = useMemo(() => {
    if (Array.isArray(opcionesSlots) && opcionesSlots.length) return opcionesSlots;
    if (Array.isArray(opcionesArrastrar) && opcionesArrastrar.length) return opcionesArrastrar;
    return [];
  }, [opcionesArrastrar, opcionesSlots]);

  const partes = useMemo(() => descomponerPlantillaCodigo(plantilla), [plantilla]);

  const slotIndices = useMemo(
    () => partes.filter((parte) => parte.tipo === "slot").map((parte) => parte.indice),
    [partes]
  );

  const slotCount = useMemo(() => {
    const indices = partes
      .filter((parte) => parte.tipo === "slot")
      .map((parte) => (Number.isFinite(parte.indice) ? parte.indice : -1))
      .filter((indice) => indice >= 0);
    if (!indices.length) {
      return Array.isArray(respuestasSlots) ? respuestasSlots.length : 0;
    }
    return Math.max(...indices) + 1;
  }, [partes, respuestasSlots]);

  const createEmptySelection = useCallback(
    () => Array.from({ length: slotCount }, () => ""),
    [slotCount]
  );
  const [seleccion, setSeleccion] = useState(() => createEmptySelection());
  const [bancoOpciones, setBancoOpciones] = useState(() => barajar(rawOptions));
  const [focusSlot, setFocusSlot] = useState(() => slotIndices[0] ?? 0);

  useEffect(() => {
    const stored = Array.isArray(respuestaActual?.seleccion?.respuestas)
      ? respuestaActual.seleccion.respuestas
      : [];
    const base = createEmptySelection();
    const inicial = base.map((_, idx) => stored[idx] || "");
    setSeleccion(inicial);
    setBancoOpciones(barajar(rawOptions));
    setFocusSlot(slotIndices[0] ?? 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pregunta.id, createEmptySelection, rawOptions, slotIndices]);

  useEffect(() => {
    if (!Array.isArray(respuestaActual?.seleccion?.respuestas)) return;
    const base = createEmptySelection();
    const filled = base.map((_, idx) => respuestaActual.seleccion.respuestas[idx] || "");
    setSeleccion(filled);
  }, [respuestaActual?.seleccion, createEmptySelection]);

  useEffect(() => {
    if (!slotIndices.length) return;
    const siguiente = slotIndices.find((indice) => !seleccion[indice]);
    const ultimo = slotIndices[slotIndices.length - 1] ?? 0;
    setFocusSlot(typeof siguiente === "number" ? siguiente : ultimo);
  }, [seleccion, slotCount, slotIndices]);

  const handleSlotClick = (slotIndex) => {
    if (disabled) return;
    setFocusSlot(slotIndex);
  };

  const handleSelectOption = (opcion) => {
    if (disabled || !opcion) return;
    setSeleccion((prev) => {
      const next = [...prev];
      let target = focusSlot;
      if (target < 0 || target >= slotCount || next[target] || !slotIndices.includes(target)) {
        const primeraLibre = slotIndices.find((indice) => !next[indice]);
        const ultimo = slotIndices[slotIndices.length - 1] ?? 0;
        target = typeof primeraLibre === "number" ? primeraLibre : ultimo;
      }
      next[target] = opcion;
      const siguiente = slotIndices.find((indice) => !next[indice]);
      setFocusSlot(typeof siguiente === "number" ? siguiente : target);
      return next;
    });
  };

  const handleResponder = () => {
    if (disabled) return;
    onResponder({
      modo: "slots",
      respuestas: [...seleccion]
    });
  };

  const handleLimpiar = () => {
    if (disabled) return;
    setSeleccion(createEmptySelection());
    setFocusSlot(0);
  };

  const renderedCodigo = completarPlantillaCodigo(plantilla, seleccion);
  const renderedHtmlPreview = useMemo(
    () => resolveHtmlAssetUrls(renderedCodigo),
    [renderedCodigo]
  );

  const previewLines = useMemo(
    () =>
      renderedCodigo
        .split(/\n/)
        .map((linea) => linea.replace(/\s+$/, ""))
        .filter((linea) => linea.trim().length),
    [renderedCodigo]
  );
  const completado = slotIndices.length
    ? slotIndices.every((indice) => Boolean(seleccion[indice]))
    : seleccion.every((valor) => valor);

  return (
    <div className="code-slot-container">
      <pre className="slot-code" aria-label="Código con espacios para completar">
        {partes.map((parte, index) => {
          if (parte.tipo === "texto") {
            return (
              <span key={`txt-${index}`} className="slot-text">
                {parte.valor}
              </span>
            );
          }
          const slotIndex = parte.indice;
          const valor = seleccion[slotIndex] || "__";
          return (
            <button
              key={`slot-${pregunta.id}-${slotIndex}-${index}`}
              type="button"
              className="slot-button"
              data-filled={Boolean(seleccion[slotIndex])}
              data-active={focusSlot === slotIndex}
              onClick={() => handleSlotClick(slotIndex)}
              disabled={disabled}
            >
              {valor}
            </button>
          );
        })}
      </pre>

      <div className="slot-options" role="group" aria-label="Opciones de código">
        {bancoOpciones.map((opcion, index) => {
          const selectedCount = seleccion.filter((valor) => valor === opcion).length;
          const maxCount = respuestasSlots.filter((valor) => valor === opcion).length || 1;
          const agotado = selectedCount >= maxCount;
          return (
            <button
              key={`slot-option-${opcion}-${index}`}
              type="button"
              className="slot-option"
              disabled={disabled || agotado}
              aria-disabled={disabled || agotado}
              onClick={() => handleSelectOption(opcion)}
            >
              {opcion}
            </button>
          );
        })}
      </div>

      <div className="slot-actions">
        <button
          type="button"
          className="button-primary"
          onClick={handleResponder}
          disabled={disabled || !completado}
        >
          Comprobar
        </button>
        <button
          type="button"
          className="button-secondary"
          onClick={handleLimpiar}
          disabled={disabled}
        >
          Limpiar
        </button>
      </div>

      {!!hints.length && (
        <small style={{ color: "var(--color-subtle)", display: "block", marginTop: 8 }}>
          Pistas: {hints.join(" · ")}
        </small>
      )}

      <div className="slot-preview" aria-live="polite">
        <ul className="slot-preview__list">
          {previewLines.map((linea, index) => (
            <li key={`preview-line-${index}`}>
              <code className="slot-preview__code">{linea}</code>
            </li>
          ))}
        </ul>

        {renderedCodigo.includes("<") && renderedCodigo.includes(">") && (
          <div
            className="slot-preview__render"
            dangerouslySetInnerHTML={{ __html: renderedHtmlPreview }}
          />
        )}
      </div>
    </div>
  );
}

CodeSlotQuestion.defaultProps = {
  respuestaActual: null,
  disabled: false
};

export default CodeSlotQuestion;
