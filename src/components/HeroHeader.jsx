import { useEffect, useRef, useState } from "react";

function HeroHeader({
  preguntasDisponibles,
  categoriasCount,
  recordsCount,
  loading,
  offlineMode,
  categoriaActual,
  theme,
  onToggleTheme,
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
        `Categoría: ${categoriaActual}. Preguntas disponibles: ${preguntasDisponibles}.`,
      );
    }
    if (filtersChanged) {
      prevFiltrosRef.current = { categoria: categoriaActual };
    }
  }, [categoriaActual, preguntasDisponibles]);

  const handleStart = () => {
    if (typeof window === "undefined") return;
    const target = window.document?.querySelector(".setup-grid");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleExamples = () => {
    if (typeof window === "undefined") return;
    const target = window.document?.querySelector(".progress-section");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

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
      <div className="hero-content">
        <div className="hero-actions" aria-label="Acciones rápidas">
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

        <h1 className="hero-title">Practica entrevistas técnicas de forma realista</h1>

        <p className="hero-subtitle">
          Simula entrevistas, recibe feedback claro y mejora tu criterio técnico con práctica guiada.
        </p>

        <div className="hero-actions">
          <button className="btn-primary" type="button" onClick={handleStart}>
            Comenzar práctica
          </button>

          <button className="btn-secondary" type="button" onClick={handleExamples}>
            Ver ejemplos
          </button>
        </div>
      </div>
    </section>
  );
}

export default HeroHeader;
