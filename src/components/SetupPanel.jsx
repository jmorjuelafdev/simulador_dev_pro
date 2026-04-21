import { useEffect, useMemo, useRef, useState } from "react";
import {
  getBlockForCategory,
  getCategoriasForBlock,
  getPreguntasPorSesion
} from "../preguntas/catalog";

function SetupPanel({
  bloques,
  config,
  onConfigChange,
  onStart,
  alerta,
  loading,
  error,
  totalPreguntasDisponibles,
  offlineMode,
  onToggleOffline,
  finishSound,
  onToggleFinishSound,
  autoAdvance,
  onToggleAutoAdvance,
  autoAdvanceDelay,
  onChangeAutoAdvanceDelay,
  onClearCache,
  onClearUsage,
  cacheInfo
}) {
  const disabled = loading;
  const [offlineAnnouncement, setOfflineAnnouncement] = useState("");
  const [configAnnouncement, setConfigAnnouncement] = useState("");
  const [cacheAnnouncement, setCacheAnnouncement] = useState("");
  const [usageAnnouncement, setUsageAnnouncement] = useState("");
  const [prefAnnouncement, setPrefAnnouncement] = useState("");
  const [prefTarget, setPrefTarget] = useState(null);
  const [prefFading, setPrefFading] = useState(false);
  const cacheTimeoutRef = useRef(null);
  const usageTimeoutRef = useRef(null);
  const prefTimeoutRef = useRef(null);
  const prefFadeRef = useRef(null);
  const bloqueSeleccionado = useMemo(
    () => getBlockForCategory(config.categoria),
    [config.categoria]
  );

  const categoriasDelBloque = useMemo(() => {
    if (bloqueSeleccionado === "Todas") return [];
    return getCategoriasForBlock(bloqueSeleccionado);
  }, [bloqueSeleccionado]);

  const preguntasPorSesion = useMemo(
    () =>
      config.categoria === "Todas"
        ? totalPreguntasDisponibles || getPreguntasPorSesion(config.categoria)
        : getPreguntasPorSesion(config.categoria),
    [config.categoria, totalPreguntasDisponibles]
  );
  const prevConfigRef = useRef({
    categoria: config.categoria,
    cantidad: config.cantidad,
    offline: offlineMode
  });

  useEffect(() => {
    setOfflineAnnouncement(
      offlineMode ? "Modo offline activado." : "Modo offline desactivado."
    );
  }, [offlineMode]);

  useEffect(() => {
    const prev = prevConfigRef.current;
    if (
      prev.categoria !== config.categoria ||
      prev.cantidad !== config.cantidad ||
      prev.offline !== offlineMode
    ) {
      setConfigAnnouncement("Configuración lista para iniciar.");
      prevConfigRef.current = {
        categoria: config.categoria,
        cantidad: config.cantidad,
        offline: offlineMode
      };
    }
  }, [config.categoria, config.cantidad, offlineMode]);

  useEffect(() => {
    return () => {
      if (cacheTimeoutRef.current) {
        clearTimeout(cacheTimeoutRef.current);
      }
      if (usageTimeoutRef.current) {
        clearTimeout(usageTimeoutRef.current);
      }
      if (prefTimeoutRef.current) {
        clearTimeout(prefTimeoutRef.current);
      }
      if (prefFadeRef.current) {
        clearTimeout(prefFadeRef.current);
      }
    };
  }, []);

  const handleClearCache = () => {
    onClearCache?.();
    setCacheAnnouncement("Cache limpiado.");
    if (cacheTimeoutRef.current) {
      clearTimeout(cacheTimeoutRef.current);
    }
    cacheTimeoutRef.current = setTimeout(() => {
      setCacheAnnouncement("");
    }, 2400);
  };

  const handleClearUsage = () => {
    onClearUsage?.();
    setUsageAnnouncement("Historial de categorías limpiado.");
    if (usageTimeoutRef.current) {
      clearTimeout(usageTimeoutRef.current);
    }
    usageTimeoutRef.current = setTimeout(() => {
      setUsageAnnouncement("");
    }, 2400);
  };

  const announcePreferenceSaved = (target) => {
    setPrefTarget(target);
    setPrefAnnouncement("Preferencia guardada.");
    setPrefFading(false);
    if (prefTimeoutRef.current) {
      clearTimeout(prefTimeoutRef.current);
    }
    if (prefFadeRef.current) {
      clearTimeout(prefFadeRef.current);
    }
    prefFadeRef.current = setTimeout(() => {
      setPrefFading(true);
    }, 1600);
    prefTimeoutRef.current = setTimeout(() => {
      setPrefAnnouncement("");
      setPrefTarget(null);
      setPrefFading(false);
    }, 2600);
  };

  const formatBytes = (bytes) => {
    if (!bytes) return "0 KB";
    const kb = bytes / 1024;
    if (kb < 1) return "1 KB";
    if (kb < 10) return `${kb.toFixed(1)} KB`;
    if (kb < 1000) return `${Math.round(kb)} KB`;
    return `${(kb / 1024).toFixed(2)} MB`;
  };

  return (
    <div className="card select-group">
      <span className="sr-only" aria-live="polite">
        Categoría: {config.categoria}.
      </span>
      <h3>Personaliza tu sesión</h3>
      <div className="select-row">
        <div className="select-field">
          <label htmlFor="bloque">Bloque</label>
          <small id="bloque-help" className="field-help">
            Elige un bloque para ver sus categorías.
          </small>
          <select
            id="bloque"
            value={bloqueSeleccionado}
            disabled={disabled}
            aria-describedby="bloque-help"
            onChange={(event) => {
              const bloque = event.target.value;
              onConfigChange((prev) => {
                if (bloque === "Todas") {
                  return {
                    ...prev,
                    categoria: "Todas",
                    cantidad: totalPreguntasDisponibles || 250
                  };
                }
                const first = getCategoriasForBlock(bloque)?.[0]?.id;
                const categoria = first || "Todas";
                return {
                  ...prev,
                  categoria,
                  cantidad: getPreguntasPorSesion(categoria)
                };
              });
            }}
          >
            <option value="Todas">Todas</option>
            {bloques.map((bloque) => (
              <option key={bloque.id} value={bloque.id}>
                {bloque.label}
              </option>
            ))}
          </select>
        </div>

        <div className="select-field">
          <label htmlFor="categoria">Categoría</label>
          <small id="categoria-help" className="field-help">
            Filtra el banco de preguntas por dominio. La dificultad aumenta progresivamente.
          </small>
          <select
            id="categoria"
            value={config.categoria}
            disabled={disabled || bloqueSeleccionado === "Todas"}
            aria-describedby="categoria-help"
            onChange={(event) => {
              const categoria = event.target.value;
              onConfigChange((prev) => ({
                ...prev,
                categoria,
                cantidad: getPreguntasPorSesion(categoria)
              }));
            }}
          >
            {bloqueSeleccionado === "Todas" ? (
              <option value="Todas">Todas</option>
            ) : (
              categoriasDelBloque.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      <div className="select-actions">
        <button onClick={onStart} disabled={loading} aria-describedby="start-help">
          {loading ? "Cargando..." : "Iniciar simulador"}
        </button>
        {loading && (
          <small style={{ color: "var(--color-subtle)" }} role="status" aria-live="polite">
            Cargando banco…
          </small>
        )}
      </div>

      <div
        style={{
          marginTop: 16,
          marginBottom: 12,
          padding: "12px 16px",
          borderRadius: 12,
          background: "rgba(23, 120, 138, 0.16)",
          display: "flex",
          flexDirection: "column",
          gap: 6,
          color: "var(--color-text)"
        }}
      >
        <strong>Preguntas en esta sesión</strong>
        <span>{preguntasPorSesion} desafíos configurados automáticamente.</span>
      </div>

      <div className="toggle-grid">
        <div className="toggle-item">
          <label className="toggle" htmlFor="offline-toggle">
            <input
              id="offline-toggle"
              type="checkbox"
              checked={offlineMode}
              onChange={(event) => onToggleOffline(event.target.checked)}
              disabled={disabled}
              role="switch"
              aria-checked={offlineMode}
              aria-label="Activar modo offline"
              aria-describedby="offline-help"
            />
            <span className="toggle-pill" aria-hidden="true" />
            <span>Modo offline (carga completa)</span>
          </label>
          <small id="offline-help" className="field-help">
            Carga todas las categorías de una vez; útil sin conexión.
          </small>
          <span className="sr-only" aria-live="polite">
            {offlineAnnouncement}
          </span>
        </div>

        <div className="toggle-item">
          <label className="toggle" htmlFor="finish-sound-toggle">
            <input
              id="finish-sound-toggle"
              type="checkbox"
              checked={finishSound}
              onChange={(event) => onToggleFinishSound(event.target.checked)}
              disabled={disabled}
              role="switch"
              aria-checked={finishSound}
              aria-label="Activar sonido al finalizar"
              aria-describedby="finish-sound-help"
            />
            <span className="toggle-pill" aria-hidden="true" />
            <span>Sonido al finalizar</span>
          </label>
          <small id="finish-sound-help" className="field-help">
            Reproduce una confirmación sonora al terminar el intento.
          </small>
        </div>

        <div className="toggle-item">
          <label className="toggle" htmlFor="auto-advance-toggle">
            <input
              id="auto-advance-toggle"
              type="checkbox"
              checked={autoAdvance}
              onChange={(event) => {
                onToggleAutoAdvance?.(event.target.checked);
                announcePreferenceSaved("toggle");
              }}
              disabled={disabled}
              role="switch"
              aria-checked={autoAdvance}
              aria-label="Avance automático al acertar"
              aria-describedby="auto-advance-help"
            />
            <span className="toggle-pill" aria-hidden="true" />
            <span>Avance automático</span>
          </label>
          <small id="auto-advance-help" className="field-help">
            Pasa a la siguiente pregunta al acertar.
          </small>
          {prefAnnouncement && prefTarget === "toggle" && (
            <small
              role="status"
              aria-live="polite"
              className={`pref-announcement align-right ${prefFading ? "fade-out" : ""}`}
            >
              {prefAnnouncement}
            </small>
          )}
        </div>

        <div className="toggle-item">
          <label htmlFor="auto-advance-delay">Delay de auto‑avance</label>
          <small id="auto-advance-delay-help" className="field-help">
            Tiempo antes de avanzar al acertar.
          </small>
          <select
            id="auto-advance-delay"
            value={autoAdvanceDelay}
            disabled={disabled || !autoAdvance}
            aria-describedby="auto-advance-delay-help"
            onChange={(event) => {
              onChangeAutoAdvanceDelay?.(Number(event.target.value));
              announcePreferenceSaved("delay");
            }}
          >
            <option value={2}>2 segundos</option>
            <option value={5}>5 segundos</option>
          </select>
          {prefAnnouncement && prefTarget === "delay" && (
            <small
              role="status"
              aria-live="polite"
              className={`pref-announcement align-right ${prefFading ? "fade-out" : ""}`}
            >
              {prefAnnouncement}
            </small>
          )}
        </div>
      </div>

      <span id="start-help" className="sr-only">
        Configuración actual: categoría {config.categoria}, sesión de {preguntasPorSesion} preguntas automáticas. Modo offline {offlineMode ? "activado" : "desactivado"}.
      </span>
      {configAnnouncement && (
        <span className="sr-only" aria-live="polite">
          {configAnnouncement}
        </span>
      )}
      
      {!loading && alerta && (
        <small style={{ color: "#f97316" }} role="status" aria-live="polite">
          {alerta}
        </small>
      )}
      {!loading && !alerta && error && (
        <small style={{ color: "#f43f5e" }} role="status" aria-live="polite">
          {error}
        </small>
      )}

      <div className="action-grid">
        <div className="action-item">
          <label htmlFor="cache-clear">Cache del banco</label>
          <small id="cache-help" className="field-help">
            Limpia el cache persistente y fuerza una carga fresca del banco.
          </small>
          <button
            id="cache-clear"
            type="button"
            className="button-secondary"
            onClick={handleClearCache}
            disabled={disabled}
            aria-describedby="cache-help"
          >
            Limpiar cache
          </button>
          <small className="field-help" aria-live="polite">
            Cache: {cacheInfo?.entries ?? 0} categorías · {formatBytes(cacheInfo?.bytes ?? 0)}
          </small>
          {(!cacheInfo?.entries || cacheInfo.entries === 0) && (
            <small className="field-help" style={{ color: "var(--color-subtle)" }}>
              Cache vacío.
            </small>
          )}
          {cacheAnnouncement && (
            <small role="status" aria-live="polite" style={{ color: "var(--color-subtle)" }}>
              {cacheAnnouncement}
            </small>
          )}
        </div>

        <div className="action-item">
          <label htmlFor="usage-clear">Historial de uso</label>
          <small id="usage-help" className="field-help">
            Reinicia las categorías favoritas usadas para el prefetch.
          </small>
          <button
            id="usage-clear"
            type="button"
            className="button-secondary"
            onClick={handleClearUsage}
            disabled={disabled}
            aria-describedby="usage-help"
          >
            Limpiar historial
          </button>
          {usageAnnouncement && (
            <small role="status" aria-live="polite" style={{ color: "var(--color-subtle)" }}>
              {usageAnnouncement}
            </small>
          )}
        </div>
      </div>
    </div>
  );
}

export default SetupPanel;
