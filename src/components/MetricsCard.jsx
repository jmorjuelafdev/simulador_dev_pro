import HeroMetrics from "./HeroMetrics";

function MetricsCard({ preguntasDisponibles, categoriasCount, recordsCount, loading }) {
  return (
    <div className="card">
      <HeroMetrics
        preguntasDisponibles={preguntasDisponibles}
        categoriasCount={categoriasCount}
        recordsCount={recordsCount}
        loading={loading}
      />
    </div>
  );
}

export default MetricsCard;
