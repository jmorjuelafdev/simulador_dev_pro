import { useEffect, useRef, useState } from "react";
import { getTopicForQuestion, LEARNING_PATHS, LEARNED_THRESHOLD } from "./learningPaths";

const DIFICULTADES = ["Basico", "Intermedio", "Avanzado"];
const normalizarDificultad = (valor) => (valor ?? "").toString().trim().toLowerCase();

function Resultado({
  puntaje,
  total,
  aciertos,
  detallePreguntas,
  config,
  learningProgress,
  records,
  isLoadingDetalle,
  onReiniciar,
  resetTemaNonce
}) {
  const porcentaje = total ? Math.round((aciertos / total) * 100) : 0;
  const mensaje = obtenerMensaje(puntaje, porcentaje);
  const sectionRef = useRef(null);
  const [dificultadFiltro, setDificultadFiltro] = useState("Todas");
  const [soloAprendidos, setSoloAprendidos] = useState(false);

  const getTopicMeta = (pregunta) => {
    const topic = getTopicForQuestion(pregunta);
    if (!topic) return null;
    const def = LEARNING_PATHS[topic.categoria]?.find((item) => item.id === topic.topicId);
    return def ? { id: def.id, label: def.label, categoria: topic.categoria } : null;
  };

  const temasDisponibles = Array.from(
    new Set(detallePreguntas.map((pregunta) => getTopicMeta(pregunta)?.label).filter(Boolean))
  );

  const esTemaAprendido = (pregunta) => {
    const meta = getTopicMeta(pregunta);
    if (!meta) return false;
    const data = learningProgress?.[meta.categoria]?.topics?.[meta.id];
    if (!data || !data.attempts) return false;
    return data.correct / data.attempts >= LEARNED_THRESHOLD;
  };

  const detalleFiltradoBase =
    dificultadFiltro === "Todas"
      ? detallePreguntas
      : detallePreguntas.filter(
          (pregunta) =>
            normalizarDificultad(pregunta.dificultad) ===
            normalizarDificultad(dificultadFiltro)
        );

  const detalleFiltrado = soloAprendidos
    ? detalleFiltradoBase.filter((pregunta) => esTemaAprendido(pregunta))
    : detalleFiltradoBase;

  const resumenTemas = temasDisponibles.reduce(
    (acc, temaLabel) => {
      const ejemplo = detallePreguntas.find(
        (pregunta) => getTopicMeta(pregunta)?.label === temaLabel
      );
      if (!ejemplo) return acc;
      if (esTemaAprendido(ejemplo)) acc.aprendidos += 1;
      acc.vistos += 1;
      return acc;
    },
    { vistos: 0, aprendidos: 0 }
  );

  useEffect(() => {
    sectionRef.current?.focus();
  }, []);

  useEffect(() => {
    setDificultadFiltro("Todas");
  }, [resetTemaNonce]);

  return (
    <section
      className="glass-panel fade-in"
      style={{ marginTop: 32 }}
      ref={sectionRef}
      tabIndex={-1}
      aria-live="polite"
    >
      <span className="sr-only" aria-live="polite">
        Resultado final: puntaje {puntaje}, precisión {porcentaje}%.
      </span>
      <header className="hero" style={{ gap: 8, marginBottom: 24 }}>
        <h2>Resultados</h2>
        <p style={{ color: "var(--color-subtle)", margin: 0 }}>
          Sesión {config.categoria} · {config.dificultad}
          {dificultadFiltro !== "Todas" ? ` · Filtro ${dificultadFiltro}` : ""}. Analiza tus métricas y decide el siguiente reto.
        </p>
      </header>

      <div className="result-grid">
        <div className="result-card" role="status" aria-live="polite">
          <h4>Puntaje</h4>
          <p style={{ fontSize: "2.5rem", margin: "8px 0" }}>{puntaje}</p>
          <span className="badge" aria-label={`Resultado: ${mensaje.texto}`}>
            {mensaje.icon} {mensaje.texto}
          </span>
        </div>
        <div className="result-card" role="status" aria-live="polite">
          <h4>Precisión</h4>
          <p style={{ fontSize: "2rem", margin: "8px 0" }}>{porcentaje}%</p>
          <small>{aciertos} de {total} preguntas correctas.</small>
          <span className="sr-only" aria-live="polite">
            Precisión actual: {porcentaje} por ciento.
          </span>
        </div>
        <div className="result-card">
          <h4>Configuración</h4>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            <li>Categoria: <strong>{config.categoria}</strong></li>
            <li>Dificultad: <strong>{config.dificultad}</strong></li>
            <li>Total preguntas: <strong>{total}</strong></li>
          </ul>
        </div>
      </div>

      <div className="card fade-in" style={{ marginTop: 24 }}>
        <h3>Detalle por pregunta</h3>
        <label htmlFor="dificultad-filtro">Filtrar por dificultad</label>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <select
            id="dificultad-filtro"
            value={dificultadFiltro}
            onChange={(event) => setDificultadFiltro(event.target.value)}
            style={{ maxWidth: 240 }}
          >
            <option value="Todos">Todos</option>
            {DIFICULTADES.map((dificultad) => (
              <option key={dificultad} value={dificultad}>
                {dificultad}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="button-secondary"
            onClick={() => setDificultadFiltro("Todas")}
            disabled={dificultadFiltro === "Todas"}
          >
            Reset filtro
          </button>
          <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input
              type="checkbox"
              checked={soloAprendidos}
              onChange={(event) => setSoloAprendidos(event.target.checked)}
              aria-describedby="solo-aprendidos-help"
            />
            Solo aprendidos
          </label>
          <span id="solo-aprendidos-help" className="sr-only">
            Filtra solo preguntas cuyos temas ya cumplen el umbral de aprendizaje.
          </span>
          {soloAprendidos && (
            <span className="badge progress-badge" aria-label="Filtro solo aprendidos activo">
              Filtro activo
            </span>
          )}
          <small style={{ color: "var(--color-subtle)" }}>
            Mostrando {detalleFiltrado.length} de {detallePreguntas.length} preguntas
          </small>
        </div>
        <ul className="record-list" role="list" aria-label="Detalle por pregunta">
          {isLoadingDetalle
            ? Array.from({ length: 4 }).map((_, index) => (
                <li key={index} className="detail-skeleton">
                  <div>
                    <div className="skeleton skeleton-line" />
                    <div className="skeleton skeleton-line short" />
                  </div>
                  <div className="skeleton skeleton-pill" />
                </li>
              ))
            : detalleFiltrado.length === 0 ? (
                <li style={{ color: "var(--color-subtle)" }}>
                  No hay preguntas para este filtro. Prueba con otro tema o desactiva "Solo aprendidos".
                  <div style={{ marginTop: 8 }}>
                    <button
                      type="button"
                      className="button-secondary"
                      onClick={() => {
                        setTemaFiltro("Todos");
                        setSoloAprendidos(false);
                      }}
                    >
                      Limpiar filtros
                    </button>
                  </div>
                </li>
              ) : detalleFiltrado.map((pregunta) => (
                <li key={pregunta.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <strong>{pregunta.pregunta}</strong>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <p style={{ margin: "4px 0", color: "var(--color-subtle)" }}>
                          {pregunta.categoria} · {pregunta.dificultad?.toUpperCase()}
                        </p>
                        {getTopicMeta(pregunta) && (
                          <span
                            className={`badge badge-topic badge-topic-${getTopicMeta(pregunta).id}`}
                            aria-label={`Tema ${getTopicMeta(pregunta).label}`}
                          >
                            {getTopicMeta(pregunta).label}
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      className={`badge ${
                        pregunta.resultado?.correcto ? "badge-success" : "badge-error"
                      }`}
                      aria-label={
                        pregunta.resultado?.correcto
                          ? "Respuesta correcta"
                          : "Respuesta incorrecta, requiere revisión"
                      }
                    >
                      {pregunta.resultado?.correcto ? "✅ Correcta" : "⚠️ Revisar"}
                    </span>
                  </div>
                  {pregunta.resultado && (
                    <small style={{ color: "var(--color-subtle)" }}>
                      {pregunta.resultado.feedback || "Sin comentario"}
                      {pregunta.resultado.incorrectos
                        ? ` · Intentos fallidos: ${pregunta.resultado.incorrectos}`
                        : ""}
                    </small>
                  )}
                </li>
              ))}
        </ul>
      </div>

      {!!records.length && (
        <div className="card fade-in" style={{ marginTop: 24 }}>
          <h3>Historial reciente</h3>
          <span className="sr-only" aria-live="polite">
            Último intento: {records[0].puntaje} puntos, {records[0].aciertos} de {records[0].total}.
          </span>
          <ul className="record-list" role="list" aria-label="Historial de intentos">
            {records.map((record) => (
              <li key={record.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <strong>{new Date(record.fecha).toLocaleString()}</strong>
                    <p style={{ margin: 0, color: "var(--color-subtle)" }}>
                      {record.categoria} · {record.dificultad}
                    </p>
                  </div>
                  <span className="badge">{record.puntaje} pts · {record.aciertos}/{record.total}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="sr-only" aria-live="polite">
        Resultado por dificultad: {config.dificultad}. Puntaje {puntaje}, precisión {porcentaje}%.
      </div>

      <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
        <span id="new-session-help" className="sr-only">
          Inicia una nueva sesión con los filtros actuales.
        </span>
        <button onClick={onReiniciar} aria-describedby="new-session-help">
          Nueva sesión
        </button>
      </div>
    </section>
  );
}

function obtenerMensaje(puntaje, porcentaje) {
  if (porcentaje >= 85 || puntaje >= 180) return { icon: "🔥", texto: "Dominio alto" };
  if (porcentaje >= 60 || puntaje >= 120) return { icon: "✅", texto: "Buen ritmo" };
  return { icon: "⚡", texto: "Sigue practicando" };
}

export default Resultado;
