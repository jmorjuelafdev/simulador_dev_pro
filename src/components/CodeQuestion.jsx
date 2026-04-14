import { useEffect, useState } from "react";

const EVALUATION_ENDPOINT = import.meta.env.VITE_EVALUATION_URL ?? "http://localhost:3000/evaluar";

const MAX_INTENTOS_SIN_SOLUCION = 3;

export default function CodeQuestion({
  pregunta,
  intentosPrevios = 0,
  disabled = false,
  onEvaluacionRemota
}) {
  const [respuesta, setRespuesta] = useState("");
  const [resultado, setResultado] = useState(null);
  const [intentos, setIntentos] = useState(intentosPrevios);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setRespuesta("");
    setResultado(null);
    setError("");
  }, [pregunta.id]);

  useEffect(() => {
    setIntentos(intentosPrevios);
  }, [intentosPrevios]);

  const evaluar = async () => {
    if (disabled) return;
    if (!respuesta.trim()) {
      setError("Escribe tu solución antes de evaluar.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(EVALUATION_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          respuestaUsuario: respuesta,
          pregunta
        })
      });
      const data = await res.json();
      setResultado(data);
      setIntentos((prev) => prev + 1);
      onEvaluacionRemota?.({
        codigo: respuesta,
        ...data
      });
    } catch (err) {
      console.error("Fallo al evaluar", err);
      setError("No se pudo evaluar. Reintenta en unos segundos.");
    } finally {
      setLoading(false);
    }
  };

  const puedeMostrarSolucion = !resultado?.correcta && intentos >= MAX_INTENTOS_SIN_SOLUCION;

  return (
    <div className="code-question-card">
      <h2>{pregunta.pregunta}</h2>
      {pregunta.descripcion && (
        <p className="code-question-desc">{pregunta.descripcion}</p>
      )}

      {!!pregunta.hints?.length && (
        <p className="code-question-hints">Pistas: {pregunta.hints.join(" · ")}</p>
      )}

      <textarea
        value={respuesta}
        onChange={(event) => setRespuesta(event.target.value)}
        className="code-question-editor"
        placeholder="Escribe tu solución aquí"
        spellCheck={false}
        disabled={loading || disabled}
      />

      <div className="code-question-actions">
        <button type="button" onClick={evaluar} disabled={loading || disabled}>
          {loading ? "Evaluando..." : "Enviar solución"}
        </button>
        <span className="code-question-attempts">Intentos: {intentos}</span>
      </div>

      {error && <p className="code-question-error">{error}</p>}

      {resultado && (
        <div className={`code-question-result ${resultado.correcta ? "success" : "error"}`}>
          <p>{resultado.mensaje}</p>
          {!resultado.correcta && intentos < MAX_INTENTOS_SIN_SOLUCION && (
            <p className="code-question-hint">
              ❌ Intenta nuevamente ({intentos}/{MAX_INTENTOS_SIN_SOLUCION})
            </p>
          )}

          {puedeMostrarSolucion && (
            <div className="code-question-solution">
              <p>💡 Solución:</p>
              <pre>{resultado.solucion || pregunta.solucion || pregunta.respuesta}</pre>
              <p className="code-question-explanation">
                {resultado.explicacion || pregunta.explicacion}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
