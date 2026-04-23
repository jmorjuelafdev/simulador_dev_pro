import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

function VacancyContext() {
  return (
    <div className="card">
      <h3>Temas clave para tu ruta junior</h3>
      <ul className="record-list">
        <li>
          <FontAwesomeIcon icon="brain" aria-label="Fundamentos" fixedWidth />{" "}
          Fundamentos: pensamiento lógico (Lógica y Lógica 2) para dominar condicionales y estructuras.
        </li>
        <li>
          <FontAwesomeIcon icon="lightbulb" aria-label="Frontend" fixedWidth />{" "}
          Frontend: JavaScript, HTML, CSS y frameworks (JavaScript 2, Angular, React) más APIs (API REST) orientados a experiencias fluidas y consistentes.
        </li>
        <li>
          <FontAwesomeIcon icon="gears" aria-label="Backend" fixedWidth />{" "}
          Backend: Python, PHP y Java para servicios robustos con buenas prácticas.
        </li>
        <li>
          <FontAwesomeIcon icon={"layer-group"} aria-label="Fullstack" fixedWidth />{" "}
          Fullstack: control de versiones con Git y bases de datos con MySQL para proyectos completos.
        </li>
        <li>
          <FontAwesomeIcon icon="handshake" aria-label="Skills" fixedWidth />{" "}
          Skills: comunicación clara, colaboración y hábitos de mejora continua (Skills 1 y 2).
        </li>
      </ul>
    </div>
  );
}

export default VacancyContext;
