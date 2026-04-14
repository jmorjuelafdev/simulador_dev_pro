import { useCallback, useEffect, useMemo, useState } from "react";
import { barajar, completarPlantillaCodigo, descomponerPlantillaCodigo } from "../utils/quiz";

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

  const slotCount = Array.isArray(respuestasSlots) ? respuestasSlots.length : 0;
  const partes = useMemo(() => descomponerPlantillaCodigo(plantilla), [plantilla]);

  const createEmptySelection = useCallback(
    () => Array.from({ length: slotCount }, () => ""),
    [slotCount]
  );
  const [seleccion, setSeleccion] = useState(() => createEmptySelection());
  const [bancoOpciones, setBancoOpciones] = useState(() => barajar(rawOptions));
  const [focusSlot, setFocusSlot] = useState(0);

  useEffect(() => {
    const stored = Array.isArray(respuestaActual?.seleccion?.respuestas)
      ? respuestaActual.seleccion.respuestas
      : [];
    const base = createEmptySelection();
    const inicial = base.map((_, idx) => stored[idx] || "");
    setSeleccion(inicial);
    setBancoOpciones(barajar(rawOptions));
    setFocusSlot(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pregunta.id, createEmptySelection, rawOptions]);

  useEffect(() => {
    if (!Array.isArray(respuestaActual?.seleccion?.respuestas)) return;
    const base = createEmptySelection();
    const filled = base.map((_, idx) => respuestaActual.seleccion.respuestas[idx] || "");
    setSeleccion(filled);
  }, [respuestaActual?.seleccion, createEmptySelection]);

  useEffect(() => {
    const siguiente = seleccion.findIndex((valor) => !valor);
    setFocusSlot(siguiente === -1 ? Math.max(slotCount - 1, 0) : siguiente);
  }, [seleccion, slotCount]);

  const handleSlotClick = (slotIndex) => {
    if (disabled) return;
    setFocusSlot(slotIndex);
  };

  const handleSelectOption = (opcion) => {
    if (disabled || !opcion) return;
    setSeleccion((prev) => {
      const next = [...prev];
      let target = focusSlot;
      if (target < 0 || target >= slotCount || next[target]) {
        const primeraLibre = next.findIndex((valor) => !valor);
        target = primeraLibre === -1 ? slotCount - 1 : primeraLibre;
      }
      next[target] = opcion;
      const siguiente = next.findIndex((valor) => !valor);
      setFocusSlot(siguiente === -1 ? target : siguiente);
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
  const completado = seleccion.every((valor) => valor);

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
              key={`slot-${slotIndex}`}
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
        {bancoOpciones.map((opcion) => {
          const selectedCount = seleccion.filter((valor) => valor === opcion).length;
          const maxCount = respuestasSlots.filter((valor) => valor === opcion).length || 1;
          const agotado = selectedCount >= maxCount;
          return (
            <button
              key={opcion}
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

      <pre className="slot-preview" aria-live="polite">
        {renderedCodigo}
      </pre>
    </div>
  );
}

CodeSlotQuestion.defaultProps = {
  respuestaActual: null,
  disabled: false
};

export default CodeSlotQuestion;
