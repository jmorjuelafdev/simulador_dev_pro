import { useMemo } from "react";

function RevisionPanel({
  preguntas,
  respuestas,
  preguntasPendientes,
  onIrPregunta,
  onVolver,
  onFinalizar,
  puedeFinalizar
}) {
  const pendientesSet = useMemo(() => new Set(preguntasPendientes.map((item) => item.id)), [
    preguntasPendientes
  ]);
  const pendientesCount = pendientesSet.size;
  const total = preguntas.length;

  const handleIrPregunta = (index) => {
    onIrPregunta?.(index);
  };

  return (
    <section className="revision-panel fade-in" style={{ marginTop: 32 }}>
      <div className="card">
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ marginBottom: 4 }}>Revisión del intento</h2>
            <p style={{ color: "var(--color-subtle)", margin: 0 }}>
              Repasa tus respuestas antes de finalizar. Puedes regresar a cualquier pregunta.
            </p>
          </div>
          <span style={{ fontWeight: 600 }}>{total} preguntas</span>
        </header>

        <div
          style={{
            marginTop: 16,
            padding: "12px 16px",
            borderRadius: 12,
            background: pendientesCount
              ? "rgba(226, 68, 92, 0.16)"
              : "rgba(46, 204, 112, 0.18)",
            color: pendientesCount ? "#b91c1c" : "#166534"
          }}
        >
          {pendientesCount ? (
            <strong>
              Tienes {pendientesCount} pregunta{pendientesCount > 1 ? "s" : ""} sin responder.
              Selecciónalas para completarlas.
            </strong>
          ) : (
            <strong>¡Todo listo! Puedes finalizar tu intento.</strong>
          )}
        </div>

        <div style={{ marginTop: 20, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", color: "var(--color-subtle)", fontSize: 14 }}>
                <th style={{ padding: "8px 12px", width: 56 }}>#</th>
                <th style={{ padding: "8px 12px" }}>Pregunta</th>
                <th style={{ padding: "8px 12px", width: 140 }}>Estado</th>
                <th style={{ padding: "8px 12px", width: 160 }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {preguntas.map((pregunta, index) => {
                const registro = respuestas[pregunta.id];
                const pendiente = pendientesSet.has(pregunta.id);
                const estado = pendiente
                  ? "Pendiente"
                  : registro?.correcto
                  ? "Correcta"
                  : "Revisar";
                return (
                  <tr
                    key={pregunta.id}
                    style={{
                      borderTop: "1px solid rgba(255,255,255,0.08)",
                      background: pendiente ? "rgba(226, 68, 92, 0.08)" : "transparent"
                    }}
                  >
                    <td style={{ padding: "12px" }}>{index + 1}</td>
                    <td style={{ padding: "12px", lineHeight: 1.4 }}>
                      <button
                        type="button"
                        onClick={() => handleIrPregunta(index)}
                        style={{
                          background: "none",
                          border: "none",
                          padding: 0,
                          color: "inherit",
                          textAlign: "left",
                          cursor: "pointer",
                          fontSize: "inherit",
                          textDecoration: "underline"
                        }}
                      >
                        {pregunta.pregunta}
                      </button>
                    </td>
                    <td style={{ padding: "12px", fontWeight: 600 }}>
                      {pendiente ? (
                        <span style={{ color: "#b91c1c" }}>{estado}</span>
                      ) : (
                        estado
                      )}
                    </td>
                    <td style={{ padding: "12px" }}>
                      <button
                        type="button"
                        className="button-secondary"
                        onClick={() => handleIrPregunta(index)}
                      >
                        Cambiar respuesta
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div
          style={{
            marginTop: 24,
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            justifyContent: "flex-end"
          }}
        >
          <button
            type="button"
            className="button-secondary"
            onClick={() => onVolver?.()}
          >
            Volver al quiz
          </button>
          <button
            type="button"
            onClick={() => onFinalizar?.()}
            disabled={!puedeFinalizar}
            title={
              puedeFinalizar
                ? "Finalizar intento"
                : "No puedes finalizar hasta responder todas las preguntas"
            }
          >
            Finalizar intento
          </button>
        </div>
      </div>
    </section>
  );
}

export default RevisionPanel;
