import { LEARNED_THRESHOLD } from "../learningPaths";
import { ORDER_BY_PROGRESION } from "../preguntas/catalog";

function ProgressOverview({ learningPaths, learningProgress, onResetProgress, onClearAll }) {
  const categorias = (() => {
    const disponibles = Object.keys(learningPaths || {});
    const ordenadas = ORDER_BY_PROGRESION.filter((categoria) => disponibles.includes(categoria));
    const restantes = disponibles.filter((categoria) => !ORDER_BY_PROGRESION.includes(categoria));
    return [...ordenadas, ...restantes];
  })();

  const getStats = (categoria) => {
    const topics = learningPaths[categoria] || [];
    const total = topics.length || 1;
    const progress = learningProgress?.[categoria]?.topics || {};
    const vistos = topics.filter((topic) => (progress[topic.id]?.attempts || 0) > 0).length;
    const aprendidos = topics.filter((topic) => {
      const data = progress[topic.id];
      if (!data || !data.attempts) return false;
      return data.correct / data.attempts >= LEARNED_THRESHOLD;
    }).length;
    return {
      total,
      vistos,
      aprendidos,
      vistosPct: Math.round((vistos / total) * 100),
      aprendidosPct: Math.round((aprendidos / total) * 100)
    };
  };

  const resumen = categorias.reduce(
    (acc, categoria) => {
      const stats = getStats(categoria);
      acc.total += stats.total;
      acc.vistos += stats.vistos;
      acc.aprendidos += stats.aprendidos;
      return acc;
    },
    { total: 0, vistos: 0, aprendidos: 0 }
  );
  const totalPct = resumen.total ? Math.round((resumen.aprendidos / resumen.total) * 100) : 0;
  const totalVistosPct = resumen.total ? Math.round((resumen.vistos / resumen.total) * 100) : 0;

  const handleReset = () => {
    if (!onResetProgress) return;
    const confirmado = window.confirm("¿Seguro que deseas reiniciar tu progreso de aprendizaje?");
    if (!confirmado) return;
    onResetProgress();
  };

  const handleClearAll = () => {
    if (!onClearAll) return;
    const confirmado = window.confirm("¿Deseas limpiar el progreso y los filtros?");
    if (!confirmado) return;
    onClearAll();
  };

  return (
    <section className="card progress-card">
      <h3>Ruta de aprendizaje</h3>
      <div className="progress-summary">
        <div>
          <p className="progress-subtitle">
            Temas vistos: al menos 1 respuesta. Temas aprendidos: precisión ≥ {Math.round(LEARNED_THRESHOLD * 100)}%.
          </p>
          <p className="progress-total">
            Avance global: {totalPct}% aprendido · {totalVistosPct}% visto
          </p>
        </div>
        <span className="badge progress-badge" aria-label={`Avance global ${totalPct}%`}>
          {totalPct}% global
        </span>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            className="button-secondary"
            onClick={handleReset}
            disabled={!resumen.total || !onResetProgress}
          >
            Reiniciar progreso
          </button>
          <button
            type="button"
            className="button-secondary"
            onClick={handleClearAll}
            disabled={!onClearAll}
          >
            Limpiar todo
          </button>
        </div>
      </div>
      <div className="progress-list" role="list">
        {categorias.map((categoria) => {
          const stats = getStats(categoria);
          return (
            <div key={categoria} className="progress-item" role="listitem">
              <div className="progress-header">
                <strong>{categoria}</strong>
                <span>
                  {stats.aprendidosPct}% aprendido · {stats.vistosPct}% visto
                </span>
              </div>
              <div className="progress-bar">
                <span
                  className="progress-bar-visto"
                  style={{ width: `${stats.vistosPct}%` }}
                  aria-hidden="true"
                />
                <span
                  className="progress-bar-aprendido"
                  style={{ width: `${stats.aprendidosPct}%` }}
                  aria-hidden="true"
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default ProgressOverview;
