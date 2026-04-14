import { useEffect, useMemo, useRef, useState } from "react";
import CodeEditor from "./CodeEditor";
import CodeQuestion from "./components/CodeQuestion";
import CodeSlotQuestion from "./components/CodeSlotQuestion";
import QuizHeader from "./components/QuizHeader";

function Quiz({
  pregunta,
  indice,
  total,
  puntaje,
  respuestaActual,
  onResponder,
  onCodigoAprobado,
  onSkip,
  onPrev,
  onNext,
  enUltimaPregunta,
  quizCompletado,
  onFinalizar,
  onAbort,
  progreso,
  totalRespondidas,
  aciertos,
  autoAdvanceEnabled,
  autoAdvanceDelay,
  onEvaluacionRemota
}) {
  const respondida = Boolean(respuestaActual?.finalizada);
  const tieneIntento = Boolean(respuestaActual);
  const esCorrecta = Boolean(respuestaActual?.correcto);
  const estadoRespuesta = esCorrecta ? "correcto" : tieneIntento ? "incorrecto" : null;
  const hints = useMemo(() => pregunta.hints || [], [pregunta.hints]);
  const actionsRef = useRef(null);
  const feedbackRef = useRef(null);
  const optionRefs = useRef([]);
  const lastScoreRef = useRef(puntaje);
  const [scoreAnnouncement, setScoreAnnouncement] = useState("");
  const finalizeRef = useRef(null);
  const [hasShaken, setHasShaken] = useState(false);
  const [shakeNext, setShakeNext] = useState(false);
  const [autoCountdown, setAutoCountdown] = useState(0);
  const [respuestaLibre, setRespuestaLibre] = useState("");
  const [respuestasBlanks, setRespuestasBlanks] = useState([]);
  const [mensajeAyuda, setMensajeAyuda] = useState("");
  const [respuestasMultiples, setRespuestasMultiples] = useState([]);
  const [progressAnnouncement, setProgressAnnouncement] = useState("");
  const prevRespondidasRef = useRef(totalRespondidas);
  const isDragSlotQuestion = pregunta.tipo === "arrastrar" && pregunta.modo === "drag-slots";
  const isSlotQuestion =
    (pregunta.tipo === "codigo" && pregunta.modo === "slots") || isDragSlotQuestion;
  const isRemoteCode = pregunta.tipo === "codigo" && pregunta.evaluacion === "remota";
  const slotSolution = respuestaActual?.detalles?.slotSolution;
  const codigoSolution =
    respuestaActual?.detalles?.modo === "codigo"
      ? respuestaActual.detalles.solucion
      : null;

  useEffect(() => {
    if (!actionsRef.current) return;
    const container = actionsRef.current.closest(".question-card");
    if (!container) return;

    const updatePadding = () => {
      const rect = actionsRef.current.getBoundingClientRect();
      container.style.setProperty("--actions-height", `${Math.ceil(rect.height)}px`);
    };

    updatePadding();
    const observer = new ResizeObserver(() => updatePadding());
    observer.observe(actionsRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!respondida || !feedbackRef.current) return;
    feedbackRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [respondida]);

  useEffect(() => {
    if (!pregunta?.opciones?.length || respondida) return;
    optionRefs.current[0]?.focus();
  }, [pregunta?.id, respondida]);

  useEffect(() => {
    if (quizCompletado) {
      finalizeRef.current?.focus();
    }
  }, [quizCompletado]);

  useEffect(() => {
    setHasShaken(false);
    setShakeNext(false);
    setAutoCountdown(0);
    if (Array.isArray(respuestaActual?.seleccion?.blanks)) {
      setRespuestasBlanks(respuestaActual.seleccion.blanks);
    } else if (Array.isArray(respuestaActual?.seleccion)) {
      setRespuestasBlanks(respuestaActual.seleccion);
    } else {
      setRespuestasBlanks([]);
    }
    setRespuestaLibre(respuestaActual?.seleccion || "");
    setMensajeAyuda("");
    if (Array.isArray(respuestaActual?.seleccion)) {
      setRespuestasMultiples(respuestaActual.seleccion);
    } else {
      setRespuestasMultiples([]);
    }
  }, [pregunta?.id]);

  useEffect(() => {
    if (pregunta.tipo !== "completar") return;
    if (Array.isArray(respuestaActual?.seleccion?.blanks)) {
      setRespuestasBlanks(respuestaActual.seleccion.blanks);
      setRespuestaLibre("{}");
      return;
    }
    if (typeof respuestaActual?.seleccion === "string") {
      setRespuestaLibre(respuestaActual.seleccion);
      setRespuestasBlanks([]);
    }
  }, [pregunta.tipo, respuestaActual?.seleccion]);

  useEffect(() => {
    if (hasShaken) return;
    if (!tieneIntento) return;
    if (respuestaActual?.finalizada) return;
    setHasShaken(true);
    setShakeNext(true);
    const timer = setTimeout(() => setShakeNext(false), 600);
    return () => clearTimeout(timer);
  }, [hasShaken, tieneIntento, respuestaActual?.finalizada]);

  useEffect(() => {
    if (!autoAdvanceEnabled) return;
    if (!esCorrecta) return;
    if (enUltimaPregunta) return;
    const delay = Number(autoAdvanceDelay) || 5;
    setAutoCountdown(delay);
    let remaining = delay;
    const interval = setInterval(() => {
      remaining -= 1;
      setAutoCountdown(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        onNext();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [autoAdvanceEnabled, autoAdvanceDelay, esCorrecta, enUltimaPregunta, onNext]);

  useEffect(() => {
    if (puntaje > lastScoreRef.current) {
      setScoreAnnouncement(`Puntaje actual: ${puntaje} puntos`);
    }
    lastScoreRef.current = puntaje;
  }, [puntaje]);

  useEffect(() => {
    if (totalRespondidas > prevRespondidasRef.current) {
      setProgressAnnouncement(`Progreso: ${totalRespondidas} de ${total}.`);
    }
    prevRespondidasRef.current = totalRespondidas;
  }, [totalRespondidas, total]);

  const etiquetaTipo = useMemo(() => {
    if (pregunta.tipo === "multiple") {
      return Array.isArray(pregunta.respuesta)
        ? "Selecciona una o más opciones"
        : "Selecciona una opción";
    }
    if (pregunta.tipo === "completar") return "Escribe la palabra o frase faltante";
    if (pregunta.tipo === "arrastrar") return "Arrastra las opciones para completar la relación";
    if (pregunta.tipo === "codigo") return "Envía tu solución";
    return "Pregunta";
  }, [pregunta.tipo]);


  const siguienteLabel = enUltimaPregunta ? "Ir a revisión" : "Siguiente";

  const inputId = useMemo(
    () => `respuesta-libre-${pregunta.id ?? indice}`,
    [pregunta.id, indice]
  );

  const blanksCount = useMemo(() => {
    if (typeof pregunta.blanks === "number") return pregunta.blanks;
    if (Array.isArray(pregunta.respuesta)) return pregunta.respuesta.length;
    return 0;
  }, [pregunta.blanks, pregunta.respuesta]);

  const isMultiBlank = blanksCount > 1;

  const placeholderLibre = pregunta.placeholder || "Ingresa la palabra clave";

  const hintsList = hints;

  const actualizarAyuda = (entrada) => {
    if (isMultiBlank) {
      const completadas = entrada.every((valor) => valor.trim());
      setMensajeAyuda(
        completadas
          ? "Todos los campos tienen texto. Envía tu respuesta cuando esté lista."
          : "Completa todos los campos antes de enviar."
      );
      return;
    }
    const limpio = entrada.trim();
    if (!limpio) {
      setMensajeAyuda("");
      return;
    }
    const referencia = (pregunta.respuesta || "").toString().toLowerCase();
    const coincide = limpio.toLowerCase().includes(referencia);
    setMensajeAyuda(
      coincide
        ? "Tu respuesta contiene la palabra clave. Puedes enviarla."
        : "Asegúrate de incluir la palabra clave indicada en la pista."
    );
  };

  const handleLibreChange = (value) => {
    setRespuestaLibre(value);
    actualizarAyuda(value);
  };

  const handleBlankChange = (index, value) => {
    setRespuestasBlanks((prev) => {
      const copia = [...prev];
      copia[index] = value;
      return copia;
    });
  };

  useEffect(() => {
    if (!isMultiBlank) return;
    const sanitized = Array.from({ length: blanksCount }, (_, idx) => respuestasBlanks[idx] || "");
    setRespuestasBlanks(sanitized);
  }, [isMultiBlank, blanksCount]);

  useEffect(() => {
    if (!isMultiBlank) return;
    actualizarAyuda(respuestasBlanks);
  }, [isMultiBlank, respuestasBlanks]);

  const resumenRespuesta = () => {
    if (isMultiBlank) {
      return { blanks: respuestasBlanks };
    }
    return respuestaLibre.trim();
  };

  const respuestaVacia = () => {
    if (isMultiBlank) {
      return respuestasBlanks.some((valor) => !valor || !valor.trim());
    }
    return !respuestaLibre.trim();
  };

  const handleResponderLibre = () => {
    if (respondida) return;
    if (respuestaVacia()) {
      setMensajeAyuda("Escribe tu respuesta antes de enviarla.");
      return;
    }
    onResponder(resumenRespuesta());
  };

  return (
    <section className="glass-panel question-card fade-in">
      <a href="#question-title" className="skip-link" tabIndex={0}>
        Saltar a la pregunta
      </a>
      <a href="#feedback-panel" className="skip-link" tabIndex={0}>
        Saltar a feedback
      </a>
      <a href="#quiz-actions" className="skip-link" tabIndex={0}>
        Saltar a acciones
      </a>
      <div className="shortcut-hints" aria-hidden="true">
        <span>Atajos: ←/↑ Anterior · →/↓ Siguiente · Enter/Space Responder</span>
      </div>
      <div className="progress-wrapper">
        <div
          className="progress-bar"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progreso)}
          aria-label="Progreso del quiz"
        >
          <span style={{ width: `${progreso}%` }} />
        </div>
        <small style={{ color: "var(--color-subtle)" }}>
          Progreso: {totalRespondidas}/{total} · Aciertos: {aciertos}
        </small>
        <span className="sr-only" aria-live="polite">
          Aciertos: {aciertos} de {total}.
        </span>
        {progressAnnouncement && (
          <span className="sr-only" aria-live="polite">
            {progressAnnouncement}
          </span>
        )}
      </div>
      <QuizHeader
        pregunta={pregunta}
        indice={indice}
        total={total}
      />
      {!autoAdvanceEnabled && (
        <small style={{ color: "var(--color-subtle)", marginTop: 4 }}>
          <span role="img" aria-label="Aviso">
            ⚠️
          </span>{" "}
          Auto‑avance desactivado: usa “Siguiente” para continuar.
        </small>
      )}
      <span className="sr-only" aria-live="polite">
        Puntaje actual: {aciertos} de {total}
      </span>
      {scoreAnnouncement && (
        <span className="sr-only" aria-live="polite">
          {scoreAnnouncement}
        </span>
      )}

      <div className="question-instructions" aria-live="polite">
        <small style={{ color: "var(--color-subtle)", display: "block", marginBottom: 8 }}>
          {etiquetaTipo}
        </small>
      </div>

      {pregunta.tipo === "multiple" &&
        !!pregunta.opciones?.length &&
        (Array.isArray(pregunta.respuesta) ? (
          <div className="checkbox-container">
            <div
              className="options-grid"
              role="group"
              aria-label={`Opciones para: ${pregunta.pregunta}`}
            >
              {pregunta.opciones.map((opcion, index) => {
                const estaSeleccionada = respuestasMultiples.includes(opcion);
                const esRespuestaCorrecta = pregunta.respuesta.includes(opcion);
                const classNames = ["option-button"];
                if (respondida && esRespuestaCorrecta) classNames.push("correct");
                if (respondida && estaSeleccionada && !esRespuestaCorrecta)
                  classNames.push("wrong");
                if (estaSeleccionada) classNames.push("selected");

                return (
                  <label
                    key={`${pregunta.id ?? "sin-id"}-opcion-${index}`}
                    className={classNames.join(" ")}
                  >
                    <input
                      type="checkbox"
                      name={`pregunta-${pregunta.id ?? indice}`}
                      value={opcion}
                      checked={estaSeleccionada}
                      onChange={() => {
                        setRespuestasMultiples((prev) =>
                          prev.includes(opcion)
                            ? prev.filter((item) => item !== opcion)
                            : [...prev, opcion]
                        );
                      }}
                      disabled={respondida}
                    />
                    <span>{opcion}</span>
                  </label>
                );
              })}
            </div>
            {!respondida && (
              <button
                className="button-primary"
                onClick={() => onResponder(respuestasMultiples)}
                disabled={respuestasMultiples.length === 0}
                style={{ marginTop: 12, justifySelf: "start" }}
              >
                Comprobar
              </button>
            )}
          </div>
        ) : (
          <div
            className="options-grid"
            role="radiogroup"
            aria-label={`Opciones para: ${pregunta.pregunta}`}
          >
            {pregunta.opciones.map((opcion, index) => {
              const estaSeleccionada = respuestaActual?.seleccion === opcion;
              const classNames = ["option-button"];
              if (respondida && opcion === pregunta.respuesta)
                classNames.push("correct");
              if (respondida && estaSeleccionada && opcion !== pregunta.respuesta)
                classNames.push("wrong");
              if (estaSeleccionada) classNames.push("selected");

              return (
                <label
                  key={`${pregunta.id ?? "sin-id"}-opcion-${index}`}
                  className={classNames.join(" ")}
                >
                  <input
                    type="radio"
                    name={`pregunta-${pregunta.id ?? indice}`}
                    value={opcion}
                    checked={estaSeleccionada}
                    onChange={() => onResponder(opcion)}
                    disabled={respondida}
                    aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown Enter Space"
                    ref={(el) => (optionRefs.current[index] = el)}
                    onKeyDown={(event) => {
                      if (respondida) return;
                      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
                        event.preventDefault();
                        const next = (index + 1) % pregunta.opciones.length;
                        optionRefs.current[next]?.focus();
                      }
                      if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
                        event.preventDefault();
                        const prev =
                          (index - 1 + pregunta.opciones.length) %
                          pregunta.opciones.length;
                        optionRefs.current[prev]?.focus();
                      }
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onResponder(opcion);
                      }
                    }}
                  />
                  <span>{opcion}</span>
                </label>
              );
            })}
          </div>
        ))}
      {pregunta.tipo === "completar" && pregunta.codigo && (
        <pre>{pregunta.codigo}</pre>
      )}

      {pregunta.tipo === "completar" && (
        <div className="free-answer-card" style={{ display: "grid", gap: 12, marginTop: 12 }}>
          <fieldset
            style={{
              border: "1px solid var(--border-color, #d0d7de)",
              borderRadius: 12,
              padding: "16px 16px 20px",
              background: "var(--color-surface-elevated)"
            }}
          >
            <legend style={{ fontWeight: 600, padding: "0 8px" }}>Escribe tu respuesta</legend>
            {pregunta.codigo && (
              <pre
                style={{
                  margin: "0 0 12px",
                  padding: "12px",
                  borderRadius: 8,
                  background: "rgba(15, 23, 42, 0.6)",
                  overflowX: "auto",
                  lineHeight: 1.5
                }}
              >
                {pregunta.codigo}
              </pre>
            )}
            {isMultiBlank ? (
              <div style={{ display: "grid", gap: 10 }}>
                {Array.from({ length: blanksCount }).map((_, idx) => {
                  const inputKey = `${inputId}-${idx}`;
                  return (
                    <div key={inputKey} style={{ display: "grid", gap: 6 }}>
                      <label htmlFor={inputKey} style={{ fontWeight: 500 }}>
                        Espacio {idx + 1}
                      </label>
                      <input
                        id={inputKey}
                        type="text"
                        value={respuestasBlanks[idx] || ""}
                        onChange={(event) => handleBlankChange(idx, event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            const siguiente = document.getElementById(`${inputId}-${idx + 1}`);
                            if (siguiente) {
                              siguiente.focus();
                            } else {
                              handleResponderLibre();
                            }
                          }
                        }}
                        disabled={respondida}
                        placeholder={placeholderLibre}
                        style={{
                          padding: "10px 12px",
                          borderRadius: 8,
                          border: "1px solid var(--border-color, #d0d7de)",
                          fontSize: "1rem"
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ display: "grid", gap: 6 }}>
                <label htmlFor={inputId} style={{ fontWeight: 500 }}>
                  Completa el espacio en blanco
                </label>
                <input
                  id={inputId}
                  type="text"
                  value={respuestaLibre}
                  onChange={(event) => handleLibreChange(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleResponderLibre();
                    }
                  }}
                  placeholder={placeholderLibre}
                  disabled={respondida}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--border-color, #d0d7de)",
                    fontSize: "1rem"
                  }}
                />
              </div>
            )}
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 12 }}>
              <button
                className="button-primary"
                onClick={handleResponderLibre}
                disabled={respondida}
                aria-label="Enviar respuesta"
              >
                Comprobar
              </button>
              {mensajeAyuda && (
                <small
                  style={{
                    color: mensajeAyuda.includes("Todos")
                      ? "var(--color-success)"
                      : mensajeAyuda.includes("contiene")
                      ? "var(--color-success)"
                      : "var(--color-warning)"
                  }}
                >
                  {mensajeAyuda}
                </small>
              )}
            </div>
            {respondida && !esCorrecta && pregunta.respuesta && (
              <details style={{ marginTop: 10, color: "var(--color-subtle)" }}>
                <summary>Ver respuesta esperada</summary>
                <pre
                  style={{
                    margin: "8px 0 0",
                    padding: "12px",
                    borderRadius: 8,
                    background: "rgba(15, 23, 42, 0.5)",
                    overflowX: "auto"
                  }}
                >
                  {Array.isArray(pregunta.respuesta)
                    ? pregunta.respuesta.join(" | ")
                    : pregunta.respuesta}
                </pre>
              </details>
            )}
          </fieldset>
        </div>
      )}

      {pregunta.tipo === "completar" && !!hints.length && !respondida && (
        <>
          <small style={{ color: "var(--color-subtle)" }}>Pistas: {hints.join(" · ")}</small>
          <span className="sr-only" aria-live="polite">
            Pistas disponibles: {hints.join(", ")}
          </span>
        </>
      )}

      {(pregunta.tipo === "codigo" || isDragSlotQuestion) && (
        isSlotQuestion ? (
          <CodeSlotQuestion
            pregunta={pregunta}
            respuestaActual={respuestaActual}
            onResponder={onResponder}
            disabled={respondida}
          />
        ) : pregunta.tipo === "codigo" && isRemoteCode ? (
          <CodeQuestion
            pregunta={pregunta}
            intentosPrevios={respuestaActual?.intentos || 0}
            disabled={respondida}
            onEvaluacionRemota={onEvaluacionRemota}
          />
        ) : (
          <CodeEditor
            pregunta={pregunta}
            onSuccess={onCodigoAprobado}
            disabled={respondida}
            intentos={respuestaActual?.intentos || 0}
          />
        )
      )}

      {tieneIntento && (
        <div
          id="feedback-panel"
          className={`feedback-panel ${estadoRespuesta === "correcto" ? "success" : "error"}`}
          role="status"
          aria-live={respuestaActual?.motivo === "timeout" ? "assertive" : "polite"}
          ref={feedbackRef}
          tabIndex={0}
        >
          <strong>{estadoRespuesta === "correcto" ? "¡Bien hecho!" : "Inténtalo de nuevo"}</strong>
          <ul className="feedback-panel__list">
            {esCorrecta ? (
              <>
                <li>
                  Excelente. La respuesta correcta es:{" "}
                  <strong>
                    {pregunta.tipo === "codigo"
                      ? slotSolution || pregunta.respuesta || codigoSolution || "Código enviado"
                      : pregunta.respuesta}
                  </strong>
                </li>
                {respuestaActual?.feedback && <li>{respuestaActual.feedback}</li>}
              </>
            ) : (
              <>
                {isSlotQuestion && slotSolution && (
                  <li>
                    La combinación correcta es:
                    <pre
                      style={{
                        margin: "8px 0 0",
                        padding: "12px",
                        background: "var(--color-surface-elevated)",
                        borderRadius: 8,
                        overflowX: "auto"
                      }}
                    >
                      {slotSolution}
                    </pre>
                  </li>
                )}
                {!isSlotQuestion && codigoSolution && (
                  <li>
                    Ejemplo de solución:
                    <pre
                      style={{
                        margin: "8px 0 0",
                        padding: "12px",
                        background: "var(--color-surface-elevated)",
                        borderRadius: 8,
                        overflowX: "auto"
                      }}
                    >
                      {codigoSolution}
                    </pre>
                  </li>
                )}
                {respuestaActual?.feedback && <li>{respuestaActual.feedback}</li>}
              </>
            )}
          </ul>
          <span className="sr-only" aria-live="polite">
            {estadoRespuesta === "correcto" ? "Respuesta correcta." : "Respuesta incorrecta."}
          </span>
        </div>
      )}

      <div className="quiz-actions" data-sticky-actions ref={actionsRef} id="quiz-actions">
        <div className="nav-buttons">
          <span id="salir-help" className="sr-only">
            Salir perderá el progreso del intento actual.
          </span>
          <button
            className="button-secondary"
            onClick={onAbort}
            aria-label="Salir del quiz"
            aria-describedby="salir-help"
            title="Salir: perderás el progreso"
          >
            <span role="img" aria-label="Salir">
              ⬅
            </span>{" "}
            Salir
          </button>
          <button
            className="button-secondary"
            onClick={onPrev}
            disabled={indice === 0}
            aria-label={`Ir a la pregunta ${Math.max(indice, 1)} de ${total}`}
            title="Atajo: ← / ↑"
          >
            <span role="img" aria-label="Anterior">
              ←
            </span>{" "}
            Anterior
          </button>
          <button
            className="button-secondary"
            onClick={onNext}
            disabled={autoCountdown > 0}
            data-shake={shakeNext ? "true" : "false"}
            aria-label={
              enUltimaPregunta
                ? "Abrir la revisión final"
                : `Ir a la pregunta ${Math.min(indice + 2, total)} de ${total}`
            }
            title="Atajo: → / ↓"
          >
            {siguienteLabel}{" "}
            <span role="img" aria-label="Siguiente">
              →
            </span>
          </button>
          {tieneIntento && !respuestaActual?.correcto && !respuestaActual?.finalizada && (
            <small style={{ color: "var(--color-warning)", marginLeft: 8 }}>
              Debes acertar para continuar.
            </small>
          )}
          {autoAdvanceEnabled && esCorrecta && !enUltimaPregunta && autoCountdown > 0 && (
            <small style={{ color: "var(--color-subtle)", marginLeft: 8 }}>
              Avanzando en {autoCountdown}s…
            </small>
          )}
          {!respuestaActual?.finalizada && (
            <small style={{ color: "var(--color-subtle)", marginLeft: 8 }}>
              Puedes avanzar y volver luego desde la revisión para completar esta pregunta.
            </small>
          )}
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            className="button-secondary"
            onClick={onSkip}
            disabled={!respuestaActual?.finalizada || !respuestaActual?.correcto}
            aria-label={`Omitir la pregunta ${indice + 1} de ${total}`}
            aria-describedby="skip-help"
            title="Omitir: se marca sin responder"
          >
            Omitir
          </button>
          <span id="skip-help" className="sr-only">
            Omitir no suma puntos ni penaliza.
          </span>
          <button
            onClick={onFinalizar}
            aria-label="Revisar y finalizar el intento"
            aria-describedby="finalizar-help"
            ref={finalizeRef}
            title="Revisar tus respuestas antes de finalizar"
          >
            Revisar y finalizar
          </button>
          <span id="finalizar-help" className="sr-only">
            Al finalizar no podrás editar tus respuestas.
          </span>
        </div>
      </div>
    </section>
  );
}

export default Quiz;
