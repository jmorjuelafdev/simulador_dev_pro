import { useEffect, useState } from "react";
import Quiz from "./Quiz";
import Resultado from "./Resultado";
import { useLeaderboard } from "./hooks/useLeaderboard";
import { useRecords } from "./hooks/useRecords";
import { useQuizEngine } from "./hooks/useQuizEngine";
import HeroHeader from "./components/HeroHeader";
import SetupPanel from "./components/SetupPanel";
import VacancyContext from "./components/VacancyContext";
import MetricsCard from "./components/MetricsCard";
import ProgressOverview from "./components/ProgressOverview";
import CelebrationOverlay from "./components/CelebrationOverlay";
import RevisionPanel from "./components/RevisionPanel";
import { BLOCKS, CATEGORY_LIST, loadPreguntasByCategory } from "./preguntas/catalog";

const STORAGE_KEY = "simulador_dev_pro_records";
const DEFAULT_CONFIG = { categoria: "Todas", cantidad: null };
const LEADERBOARD_ENDPOINT = "https://jsonplaceholder.typicode.com/users";
const THEME_STORAGE_KEY = "simulador_theme";

function App() {
  const [offlineMode, setOfflineMode] = useState(false);
  const [finishSound, setFinishSound] = useState(false);
  const [temaResetNonce, setTemaResetNonce] = useState(0);
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "dark";
    try {
      const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
      return stored === "light" ? "light" : "dark";
    } catch (error) {
      return "dark";
    }
  });
  const [autoAdvance, setAutoAdvance] = useState(() => {
    if (typeof window === "undefined") return true;
    try {
      const stored = window.localStorage.getItem("simulador_auto_advance_enabled");
      if (stored === null) return true;
      return stored === "true";
    } catch (error) {
      return true;
    }
  });
  const [autoAdvanceDelay, setAutoAdvanceDelay] = useState(() => {
    if (typeof window === "undefined") return 5;
    try {
      const stored = window.localStorage.getItem("simulador_auto_advance_delay");
      const parsed = stored ? Number(stored) : 2;
      return [2, 5].includes(parsed) ? parsed : 2;
    } catch (error) {
      return 2;
    }
  });
  const [records, setRecords] = useRecords(STORAGE_KEY);
  const { leaderboard, leaderboardError, leaderboardLoading } =
    useLeaderboard(LEADERBOARD_ENDPOINT);
  const {
    fase,
    config,
    setConfig,
    preguntasActivas,
    indiceActual,
    puntaje,
    alerta,
    celebracionActiva,
    bankLoading,
    bankError,
    detalleLoading,
    categorias,
    dificultades,
    preguntasDisponibles,
    totalPreguntasDisponibles,
    preguntaActual,
    respuestaActual,
    totalRespondidas,
    aciertos,
    progreso,
    quizCompletado,
    detallePreguntas,
    cacheInfo,
    learningProgress,
    learningPaths,
    respuestas,
    preguntasPendientes,
    puedeFinalizarIntento,
    enUltimaPregunta,
    irAIndice,
    mostrarRevision,
    salirRevision,
    iniciarSimulador,
    manejarRespuesta,
    manejarCodigoAprobado,
    manejarEvaluacionRemota,
    manejarSkip,
    irAnterior,
    irSiguiente,
    finalizarQuiz,
    salirQuiz,
    reiniciar,
    clearCache,
    clearCategoryUsage,
    clearLearningProgress
  } = useQuizEngine({
    defaultConfig: DEFAULT_CONFIG,
    onSaveRecord: (registro) => setRecords((prev) => [registro, ...prev].slice(0, 6)),
    categoriasBase: CATEGORY_LIST,
    loadPreguntasByCategoria: loadPreguntasByCategory,
    forceAllCategories: offlineMode,
    finishSoundEnabled: finishSound,
    autoAdvanceEnabled: autoAdvance
  });

  const handleClearAll = () => {
    clearLearningProgress();
    setTemaResetNonce((prev) => prev + 1);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        "simulador_auto_advance_delay",
        String(autoAdvanceDelay)
      );
    } catch (error) {
      console.warn("No se pudo guardar auto-advance delay", error);
    }
  }, [autoAdvanceDelay]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const root = window.document?.documentElement;
      if (root) {
        root.classList.toggle("theme-light", theme === "light");
      }
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (error) {
      console.warn("No se pudo guardar tema", error);
    }
  }, [theme]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        "simulador_auto_advance_enabled",
        String(autoAdvance)
      );
    } catch (error) {
      console.warn("No se pudo guardar auto-advance enabled", error);
    }
  }, [autoAdvance]);

  return (
    <div className="app-shell">
      <HeroHeader
        preguntasDisponibles={totalPreguntasDisponibles || preguntasDisponibles.length}
        categoriasCount={categorias.length - 1}
        recordsCount={records.length}
        loading={bankLoading}
        offlineMode={offlineMode}
        categoriaActual={config.categoria}
        theme={theme}
        onToggleTheme={() => setTheme((prev) => (prev === "light" ? "dark" : "light"))}
      />

      {fase === "setup" && (
        <>
          <section className="setup-grid fade-in" style={{ marginBottom: 0 }}>
            <SetupPanel
              bloques={BLOCKS}
              config={config}
              onConfigChange={setConfig}
              onStart={iniciarSimulador}
              alerta={alerta}
              loading={bankLoading}
              error={bankError}
              totalPreguntasDisponibles={totalPreguntasDisponibles}
              offlineMode={offlineMode}
              onToggleOffline={setOfflineMode}
            finishSound={finishSound}
            onToggleFinishSound={setFinishSound}
            autoAdvance={autoAdvance}
            onToggleAutoAdvance={setAutoAdvance}
            autoAdvanceDelay={autoAdvanceDelay}
            onChangeAutoAdvanceDelay={setAutoAdvanceDelay}
            onClearCache={clearCache}
            onClearUsage={clearCategoryUsage}
            cacheInfo={cacheInfo}
          />

            <div className="stacked-cards">
              <VacancyContext />
              <MetricsCard
                preguntasDisponibles={totalPreguntasDisponibles || preguntasDisponibles.length}
                categoriasCount={categorias.length - 1}
                recordsCount={records.length}
                loading={bankLoading}
              />
            </div>
          </section>
          <section className="fade-in progress-section" style={{ marginTop: 0 }}>
            <ProgressOverview
              learningPaths={learningPaths}
              learningProgress={learningProgress}
              onResetProgress={clearLearningProgress}
              onClearAll={handleClearAll}
            />
          </section>
        </>
      )}

      {fase === "quiz" && preguntaActual && (
        <Quiz
          pregunta={preguntaActual}
          indice={indiceActual}
          total={preguntasActivas.length}
          puntaje={puntaje}
          respuestaActual={respuestaActual}
          onResponder={manejarRespuesta}
          onCodigoAprobado={manejarCodigoAprobado}
          onEvaluacionRemota={manejarEvaluacionRemota}
          onSkip={manejarSkip}
          onPrev={irAnterior}
          onNext={irSiguiente}
          puedeAvanzar={indiceActual + 1 < preguntasActivas.length}
          enUltimaPregunta={enUltimaPregunta}
          quizCompletado={quizCompletado}
          onFinalizar={mostrarRevision}
          onAbort={salirQuiz}
          progreso={progreso}
          totalRespondidas={totalRespondidas}
          aciertos={aciertos}
          autoAdvanceEnabled={autoAdvance}
          autoAdvanceDelay={autoAdvanceDelay}
        />
      )}

      {fase === "revision" && (
        <RevisionPanel
          preguntas={preguntasActivas}
          respuestas={respuestas}
          preguntasPendientes={preguntasPendientes}
          onIrPregunta={irAIndice}
          onVolver={salirRevision}
          onFinalizar={finalizarQuiz}
          puedeFinalizar={puedeFinalizarIntento}
        />
      )}

      {fase === "resultado" && (
        <Resultado
          puntaje={puntaje}
          total={preguntasActivas.length}
          aciertos={aciertos}
          detallePreguntas={detallePreguntas}
          config={config}
          learningProgress={learningProgress}
          records={records}
          leaderboard={leaderboard}
          leaderboardError={leaderboardError}
          leaderboardLoading={leaderboardLoading}
          isLoadingDetalle={detalleLoading}
          onReiniciar={reiniciar}
          resetTemaNonce={temaResetNonce}
        />
      )}

      {celebracionActiva && <CelebrationOverlay />}
    </div>
  );
}

export default App;
