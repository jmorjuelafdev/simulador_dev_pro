import { useEffect, useMemo, useState } from "react";

function CodeEditor({ pregunta, onSuccess, disabled, intentos = 0 }) {
  const [code, setCode] = useState(pregunta.boilerplate || "");
  const [validaciones, setValidaciones] = useState([]);
  const [estado, setEstado] = useState(null);
  const [running, setRunning] = useState(false);
  const isManual = pregunta.evaluacion === "manual";

  useEffect(() => {
    setCode(pregunta.boilerplate || "");
    setValidaciones([]);
    setEstado(null);
  }, [pregunta.id, pregunta.boilerplate]);

  const requisitos = useMemo(
    () => pregunta.validations || [],
    [pregunta.validations],
  );

  const ejecutarPruebas = () => {
    if (disabled) return;
    if (isManual) {
      setEstado({
        tipo: "success",
        mensaje: "Solución guardada y enviada para revisión manual.",
      });
      onSuccess?.({
        codigo: code,
        detalles: { modo: "manual" },
        feedback:
          pregunta.feedbackManual ||
          "Solución guardada y enviada para revisión manual. Continúa con la siguiente pregunta.",
        motivo: "manual",
        correcto: true,
      });
      return;
    }
    setRunning(true);
    const resultados = requisitos.map((regla) => {
      const passed = evaluarRegla(regla, code, pregunta.respuesta);
      return {
        ...regla,
        passed,
      };
    });
    setValidaciones(resultados);
    setRunning(false);

    const todosOk = resultados.length
      ? resultados.every((r) => r.passed)
      : true;

    if (todosOk) {
      setEstado({ tipo: "success", mensaje: "¡Validaciones superadas!" });
      onSuccess?.({ codigo: code, detalles: { validaciones: resultados } });
    } else {
      setEstado({
        tipo: "error",
        mensaje: "Ajusta tu solución hasta completar todas las validaciones.",
      });
    }
  };

  return (
    <div className="code-editor-wrapper">
      {pregunta.boilerplate && (
        <small style={{ color: "var(--color-subtle)" }}>
          Fragmento base proporcionado
        </small>
      )}
      <div className="code-editor">
        <div className="code-line-numbers">
          {Array.from(code.split("\n"), (_, idx) => idx + 1).join("\n")}
        </div>
        <textarea
          className="code-textarea"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          spellCheck={false}
          disabled={disabled}
        />
      </div>

      {!!pregunta.hints?.length && (
        <p style={{ color: "var(--color-subtle)", margin: "12px 0" }}>
          Pistas: {pregunta.hints.join(" · ")}
        </p>
      )}

      {isManual && (
        <p style={{ color: "var(--color-subtle)", margin: "8px 0 12px" }}>
          Revisión manual: la solución se guarda y se envía sin validaciones
          automáticas.
        </p>
      )}

      <button
        onClick={ejecutarPruebas}
        disabled={disabled || running}
        title={isManual ? "Guardar solución" : undefined}
      >
        {running
          ? "Evaluando..."
          : isManual
            ? "Enviar para revisión"
            : "Ejecutar validaciones"}
      </button>
      {isManual && (
        <small className="code-editor-helper">Guardar solución</small>
      )}
      {intentos > 0 && (
        <small
          style={{
            color: "var(--color-subtle)",
            display: "block",
            marginTop: 6,
          }}
        >
          Intentos: {intentos}
        </small>
      )}

      {!isManual && !!validaciones.length && (
        <div className="validation-list" style={{ marginTop: 16 }}>
          {validaciones.map((val) => (
            <div
              key={val.id}
              className={`validation-item ${val.passed ? "passed" : "failed"}`}
            >
              {val.passed ? "✅" : "⚠️"} {val.label}
            </div>
          ))}
        </div>
      )}

      {estado && (
        <p
          style={{
            marginTop: 12,
            color:
              estado.tipo === "success"
                ? "var(--color-success)"
                : "var(--color-error)",
          }}
        >
          {estado.mensaje}
        </p>
      )}
    </div>
  );
}

function evaluarRegla(regla = {}, code = "", respuesta = "") {
  if (!regla) return true;
  switch (regla.type) {
    case "includes":
      return code.toLowerCase().includes((regla.value || "").toLowerCase());
    case "regex":
      try {
        const expr = new RegExp(regla.value, "m");
        return expr.test(code);
      } catch (error) {
        console.warn("Regex inválido", regla.value, error);
        return false;
      }
    case "respuesta":
      return code.toLowerCase().includes((respuesta || "").toLowerCase());
    default:
      return false;
  }
}

export default CodeEditor;
