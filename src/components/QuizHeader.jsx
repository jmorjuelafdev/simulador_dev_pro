function QuizHeader({
  pregunta,
  indice,
  total
}) {
  const dificultadLabel = pregunta.dificultad?.toUpperCase();
  const announceQuestionChange = true;

  return (
    <header className="quiz-header" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between" }}>
        <div>
          <p className="badge" aria-current="step">
            Pregunta {indice + 1} / {total}
          </p>
          <h2 id="question-title" style={{ margin: "8px 0" }}>
            {pregunta.pregunta}
          </h2>
          {pregunta.descripcion && (
            <p style={{ color: "var(--color-subtle)", margin: 0 }}>{pregunta.descripcion}</p>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
          <div className="badge">{pregunta.categoria} · {dificultadLabel}</div>
        </div>
      </div>
      {announceQuestionChange && (
        <span className="sr-only" aria-live="polite">
          Pregunta {indice + 1} de {total}
        </span>
      )}
    </header>
  );
}

export default QuizHeader;
