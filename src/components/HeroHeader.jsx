import { useEffect, useRef, useState } from "react";

function HeroHeader({
  preguntasDisponibles,
  categoriasCount,
  recordsCount,
  loading,
  offlineMode,
  categoriaActual
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
        <h1>Simulador Junior Dev · Fundamentos Claros</h1>
        {offlineMode && <span className="badge offline-badge">Offline activo</span>}
      </div>
      <p style={{ textAlign: "center" }}>
        Practica entrevistas básicas con lógica, JavaScript, Python, Fullstack y Skills. Todas las
        preguntas usan opciones en formato de selección única y ejercicios con slots (sin editor de
        código), con pistas y feedback claro para avanzar paso a paso.
      </p>
    </section>
  );
}

export default HeroHeader;
