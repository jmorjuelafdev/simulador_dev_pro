function HeroMetrics({ preguntasDisponibles, categoriasCount, recordsCount, loading }) {
  const preguntasCap = 250;
  const preguntasTexto = loading ? "" : Math.min(preguntasDisponibles, preguntasCap);
  const categoriasTexto = loading ? "" : categoriasCount;
  const recordsTexto = loading ? "" : recordsCount;

  return (
    <div className="hero-metrics" aria-label="Resumen de métricas">
      <div className="metric" aria-label="Total de preguntas disponibles">
        <span>Preguntas disponibles</span>
        {loading ? <div className="skeleton skeleton-number" /> : <strong>{preguntasTexto}</strong>}
      </div>
      <div className="metric" aria-label="Cantidad de categorías">
        <span>Categorías</span>
        {loading ? <div className="skeleton skeleton-number" /> : <strong>{categoriasTexto}</strong>}
      </div>
      <div className="metric" aria-label="Intentos guardados en el historial">
        <span>Intentos guardados</span>
        {loading ? <div className="skeleton skeleton-number" /> : <strong>{recordsTexto}</strong>}
      </div>
    </div>
  );
}

export default HeroMetrics;
