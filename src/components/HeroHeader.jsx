import { useEffect, useRef, useState } from "react";

function HeroHeader({
  preguntasDisponibles,
  categoriasCount,
  recordsCount,
  loading,
  offlineMode,
  categoriaActual,
  theme,
  onToggleTheme
}) {
  const prevDisponiblesRef = useRef(preguntasDisponibles);
  const prevRecordsRef = useRef(recordsCount);
  const prevCategoriasRef = useRef(categoriasCount);
  const hasMountedRef = useRef(false);
  const [announcement, setAnnouncement] = useState("");
  const [recordsAnnouncement, setRecordsAnnouncement] = useState("");
  const [categoriasAnnouncement, setCategoriasAnnouncement] = useState("");
  const [filtrosAnnouncement, setFiltrosAnnouncement] = useState("");
  const prevFiltrosRef = useRef({ categoria: categoriaActual });

  useEffect(() => {
    if (prevDisponiblesRef.current !== preguntasDisponibles) {
      setAnnouncement(`Preguntas disponibles: ${preguntasDisponibles}.`);
      prevDisponiblesRef.current = preguntasDisponibles;
    }
  }, [preguntasDisponibles]);

  useEffect(() => {
    if (prevRecordsRef.current !== recordsCount) {
      setRecordsAnnouncement(`Intentos guardados: ${recordsCount}.`);
      prevRecordsRef.current = recordsCount;
    }
  }, [recordsCount]);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      prevCategoriasRef.current = categoriasCount;
      prevFiltrosRef.current = { categoria: categoriaActual };
      return;
    }
    if (prevCategoriasRef.current !== categoriasCount) {
      setCategoriasAnnouncement(`Categorías disponibles: ${categoriasCount}.`);
      prevCategoriasRef.current = categoriasCount;
    }
  }, [categoriasCount]);

  useEffect(() => {
    if (!hasMountedRef.current) return;
    const prev = prevFiltrosRef.current;
    const filtersChanged = prev.categoria !== categoriaActual;
    const countChanged = prevDisponiblesRef.current !== preguntasDisponibles;
    if (filtersChanged && countChanged) {
      setFiltrosAnnouncement(
        `Categoría: ${categoriaActual}. Preguntas disponibles: ${preguntasDisponibles}.`
      );
    }
    if (filtersChanged) {
      prevFiltrosRef.current = { categoria: categoriaActual };
    }
  }, [categoriaActual, preguntasDisponibles]);

  return (
    <section className="glass-panel hero">
      {announcement && (
        <span className="sr-only" aria-live="polite">
          {announcement}
        </span>
      )}
      {recordsAnnouncement && (
        <span className="sr-only" aria-live="polite">
          {recordsAnnouncement}
        </span>
      )}
      {categoriasAnnouncement && (
        <span className="sr-only" aria-live="polite">
          {categoriasAnnouncement}
        </span>
      )}
      {filtrosAnnouncement && (
        <span className="sr-only" aria-live="polite">
          {filtrosAnnouncement}
        </span>
      )}
      <div className="hero-title">
        <h1>Simulador Junior Dev · Biblioteca 2026</h1>
        <div className="hero-actions">
          {offlineMode && <span className="badge offline-badge">Offline activo</span>}
          <label className="toggle" htmlFor="theme-toggle">
            <input
              id="theme-toggle"
              type="checkbox"
              checked={theme === "light"}
              onChange={() => onToggleTheme?.()}
              role="switch"
              aria-checked={theme === "light"}
              aria-label="Activar tema claro"
            />
            <span className="toggle-pill" aria-hidden="true" />
            <span>{theme === "light" ? "Tema claro" : "Tema oscuro"}</span>
          </label>
        </div>
      </div>
      <p className="hero-subtitle">
        Practica entrevistas completas con evaluaciones dinámicas, feedback guiado y rutas de
        aprendizaje que acompañan tu progreso en cada bloque.
      </p>
      <div className="hero-copy">
        <p>
          Actualizamos todos los bancos de preguntas con escenarios modernos: API REST con
          enunciados extensos, CSS con flexbox, grid y responsive, Angular y React con buenas
          prácticas de componentes, además de Git, MySQL y Skills profesionales con situaciones
          reales de colaboración.
        </p>
        <ul className="hero-highlights">
          <li>
            <strong>Catálogo completo:</strong> Fundamentos, Frontend (HTML, CSS, JavaScript, Estructura de
            Datos, Angular, React, API REST), Backend (Python, PHP, Java), Fullstack (Git, MySQL) y Skills
            (niveles 1 y 2).
          </li>
          <li>
            <strong>Ejercicios aplicados:</strong> preguntas múltiples, código con slots y validaciones remotas
            listas para simular entrevistas técnicas.
          </li>
          <li>
            <strong>Modo experto opcional:</strong> activa aprendizaje offline, sonido al finalizar e
            autoavance para acelerar tus sesiones.
          </li>
        </ul>
      </div>
    </section>
  );
}

export default HeroHeader;
