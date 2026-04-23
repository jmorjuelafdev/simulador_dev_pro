import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  barajar,
  completarPlantillaCodigo,
  descomponerPlantillaCodigo,
  construirJustificacion,
  cryptoId
} from "../utils/quiz";
import { getTopicForQuestion, LEARNING_PATHS } from "../learningPaths";
import {
  CATEGORY_LIST,
  loadPreguntasByCategory,
  loadTotalPreguntasCount,
  ORDER_BY_PROGRESION
} from "../preguntas/catalog";

const CACHE_VERSION = "v13";
const DIFFICULTY_ORDER = {
  Basico: 0,
  Intermedio: 1,
  Avanzado: 2
};

export function useQuizEngine({
  defaultConfig,
  onSaveRecord,
  categoriasBase,
  loadPreguntasByCategoria,
  forceAllCategories = false,
  finishSoundEnabled = false,
  autoAdvanceEnabled = true
}) {
  const CACHE_PREFIX = `simulador_${CACHE_VERSION}_bank_`;
  const CACHE_USAGE_KEY = `simulador_${CACHE_VERSION}_categoria_usage`;
  const CACHE_TTL_DAYS = 21;
  const CACHE_TTL_MS = CACHE_TTL_DAYS * 24 * 60 * 60 * 1000;
  const PROGRESS_KEY = "simulador_learning_progress";
  const [bancoPreguntas, setBancoPreguntas] = useState([]);
  const [totalPreguntasDisponibles, setTotalPreguntasDisponibles] = useState(0);
  const [bankLoading, setBankLoading] = useState(false);
  const [bankError, setBankError] = useState("");
  const [detalleLoading, setDetalleLoading] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const cacheRef = useRef(new Map());
  const prefetchingRef = useRef(new Set());
  const [fase, setFase] = useState("setup");
  const [config, setConfig] = useState(defaultConfig);
  const [preguntasActivas, setPreguntasActivas] = useState([]);
  const [indiceActual, setIndiceActual] = useState(0);
  const [respuestas, setRespuestas] = useState({});
  const [puntaje, setPuntaje] = useState(0);
  const [alerta, setAlerta] = useState("");
  const [celebracionActiva, setCelebracionActiva] = useState(false);
  const [cacheInfo, setCacheInfo] = useState({ entries: 0, bytes: 0 });
  const [learningProgress, setLearningProgress] = useState(() => {
    if (typeof window === "undefined") return {};
    try {
      const raw = window.localStorage.getItem(PROGRESS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (error) {
      return {};
    }
  });
  const audioCtxRef = useRef(null);

  const categorias = useMemo(() => {
    const disponibles = categoriasBase.filter(Boolean);
    const ordenadas = ORDER_BY_PROGRESION.filter((categoria) => disponibles.includes(categoria));
    const restantes = disponibles.filter((categoria) => !ORDER_BY_PROGRESION.includes(categoria));
    return ["Todas", ...ordenadas, ...restantes];
  }, [categoriasBase]);

  const preguntasDisponibles = useMemo(() => {
    return bancoPreguntas.filter((pregunta) => {
      const coincideCategoria =
        config.categoria === "Todas" || pregunta.categoria === config.categoria;
      return coincideCategoria;
    });
  }, [bancoPreguntas, config.categoria]);


  const parseBankCache = useCallback((raw) => {
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return { timestamp: Date.now(), data: parsed };
      }
      if (parsed && Array.isArray(parsed.data)) {
        return {
          timestamp: typeof parsed.timestamp === "number" ? parsed.timestamp : Date.now(),
          data: parsed.data
        };
      }
    } catch (error) {
      return null;
    }
    return null;
  }, []);

  const readCache = useCallback(
    (key) => {
      if (typeof window === "undefined" || key === "Todas") return null;
      try {
        const cached = window.localStorage.getItem(`${CACHE_PREFIX}${key}`);
        const parsed = parseBankCache(cached);
        if (!parsed) return null;
        if (Date.now() - parsed.timestamp > CACHE_TTL_MS) {
          window.localStorage.removeItem(`${CACHE_PREFIX}${key}`);
          return null;
        }
        return parsed.data;
      } catch (error) {
        console.warn("Cache local corrupta", key, error);
        return null;
      }
    },
    [CACHE_PREFIX, CACHE_TTL_MS, parseBankCache]
  );

  const normalizeUsage = useCallback((raw) => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
    return Object.entries(raw).reduce((acc, [cat, value]) => {
      if (typeof value === "number") {
        acc[cat] = { count: value, lastUsed: 0 };
      } else if (value && typeof value === "object") {
        acc[cat] = {
          count: typeof value.count === "number" ? value.count : 0,
          lastUsed: typeof value.lastUsed === "number" ? value.lastUsed : 0
        };
      }
      return acc;
    }, {});
  }, []);

  const recordCategoryUsage = useCallback(
    (categoria) => {
      if (typeof window === "undefined") return;
      if (!categoria || categoria === "Todas") return;
      try {
        const raw = window.localStorage.getItem(CACHE_USAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : {};
        const usage = normalizeUsage(parsed);
        const prev = usage[categoria] || { count: 0, lastUsed: 0 };
        usage[categoria] = { count: prev.count + 1, lastUsed: Date.now() };
        window.localStorage.setItem(CACHE_USAGE_KEY, JSON.stringify(usage));
      } catch (error) {
        console.warn("No se pudo guardar historial de categorias", error);
      }
    },
    [CACHE_USAGE_KEY, normalizeUsage]
  );

  const getTopCategories = useCallback(
    (limit = 2) => {
      if (typeof window === "undefined") return [];
      try {
        const raw = window.localStorage.getItem(CACHE_USAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : {};
        const usage = normalizeUsage(parsed);
        return Object.entries(usage)
          .filter(([cat]) => categoriasBase.includes(cat))
          .sort((a, b) => {
            const countDiff = b[1].count - a[1].count;
            if (countDiff !== 0) return countDiff;
            return b[1].lastUsed - a[1].lastUsed;
          })
          .slice(0, limit)
          .map(([cat]) => cat);
      } catch (error) {
        return [];
      }
    },
    [CACHE_USAGE_KEY, categoriasBase, normalizeUsage]
  );

  const prefetchTopLimit = useMemo(() => {
    if (!categoriasBase?.length) return 2;
    if (categoriasBase.length >= 12) return 4;
    return categoriasBase.length >= 8 ? 3 : 2;
  }, [categoriasBase]);

  const computeCacheInfo = useCallback(() => {
    if (typeof window === "undefined") return { entries: 0, bytes: 0 };
    let entries = 0;
    let bytes = 0;
    try {
      const encoder = typeof TextEncoder !== "undefined" ? new TextEncoder() : null;
      Object.keys(window.localStorage).forEach((key) => {
        if (!key.startsWith(CACHE_PREFIX)) return;
        const value = window.localStorage.getItem(key) || "";
        entries += 1;
        bytes += encoder ? encoder.encode(value).length : value.length;
      });
    } catch (error) {
      return { entries: 0, bytes: 0 };
    }
    return { entries, bytes };
  }, [CACHE_PREFIX]);

  const refreshCacheInfo = useCallback(() => {
    setCacheInfo(computeCacheInfo());
  }, [computeCacheInfo]);

  const writeCache = useCallback(
    (key, data) => {
      if (typeof window === "undefined" || key === "Todas") return;
      try {
        window.localStorage.setItem(
          `${CACHE_PREFIX}${key}`,
          JSON.stringify({ timestamp: Date.now(), data })
        );
      } catch (error) {
        console.warn("No se pudo guardar cache local", key, error);
      }
      refreshCacheInfo();
    },
    [CACHE_PREFIX, refreshCacheInfo]
  );

  const clearCache = useCallback(() => {
    cacheRef.current.clear();
    prefetchingRef.current.clear();
    if (typeof window === "undefined") return;
    try {
      const keys = Object.keys(window.localStorage);
      keys.forEach((key) => {
        if (key.startsWith(CACHE_PREFIX)) {
          window.localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn("No se pudo limpiar cache local", error);
    }
    refreshCacheInfo();
  }, [CACHE_PREFIX, refreshCacheInfo]);

  const clearCategoryUsage = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(CACHE_USAGE_KEY);
    } catch (error) {
      console.warn("No se pudo limpiar historial de categorias", error);
    }
  }, [CACHE_USAGE_KEY]);

  const clearLearningProgress = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(PROGRESS_KEY);
      setLearningProgress({});
    } catch (error) {
      console.warn("No se pudo limpiar progreso de aprendizaje", error);
    }
  }, [PROGRESS_KEY]);

  const updateLearningProgress = useCallback(
    (pregunta, correcto) => {
      const topic = getTopicForQuestion(pregunta);
      if (!topic) return;
      setLearningProgress((prev) => {
        const next = { ...prev };
        if (!next[topic.categoria]) next[topic.categoria] = { topics: {} };
        if (!next[topic.categoria].topics) next[topic.categoria].topics = {};
        const current = next[topic.categoria].topics[topic.topicId] || {
          attempts: 0,
          correct: 0
        };
        next[topic.categoria].topics[topic.topicId] = {
          attempts: current.attempts + 1,
          correct: current.correct + (correcto ? 1 : 0)
        };
        if (typeof window !== "undefined") {
          try {
            window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
          } catch (error) {
            console.warn("No se pudo guardar progreso de aprendizaje", error);
          }
        }
        return next;
      });
    },
    [PROGRESS_KEY]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const now = Date.now();
      Object.keys(window.localStorage).forEach((key) => {
        if (!key.startsWith(CACHE_PREFIX)) return;
        const parsed = parseBankCache(window.localStorage.getItem(key));
        if (!parsed) {
          window.localStorage.removeItem(key);
          return;
        }
        if (now - parsed.timestamp > CACHE_TTL_MS) {
          window.localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn("No se pudo limpiar cache expirada", error);
    }
    refreshCacheInfo();
  }, [CACHE_PREFIX, CACHE_TTL_MS, parseBankCache, refreshCacheInfo]);

  const ensureBanco = useCallback(
    async (categoria) => {
      const key = forceAllCategories ? "Todas" : categoria || "Todas";
      if (cacheRef.current.has(key)) {
        setBancoPreguntas(cacheRef.current.get(key));
        return cacheRef.current.get(key);
      }

      const cached = readCache(key);
      if (cached) {
        cacheRef.current.set(key, cached);
        setBancoPreguntas(cached);
        return cached;
      }

      setBankLoading(true);
      setBankError("");
      try {
        const data = await loadPreguntasByCategoria(key);
        cacheRef.current.set(key, data);
        setBancoPreguntas(data);
        writeCache(key, data);
        return data;
      } catch (error) {
        console.warn("No se pudo cargar el banco de preguntas", error);
        setBankError("No se pudo cargar el banco de preguntas");
        setBancoPreguntas([]);
        return [];
      } finally {
        setBankLoading(false);
      }
    },
    [forceAllCategories, loadPreguntasByCategoria, readCache, writeCache]
  );

  const prefetchCategoria = useCallback(
    async (categoria) => {
      if (!categoria || categoria === "Todas") return;
      if (cacheRef.current.has(categoria)) return;
      if (prefetchingRef.current.has(categoria)) return;
      prefetchingRef.current.add(categoria);
      try {
        const cached = readCache(categoria);
        if (cached) {
          cacheRef.current.set(categoria, cached);
          return;
        }
        const data = await loadPreguntasByCategoria(categoria);
        cacheRef.current.set(categoria, data);
        writeCache(categoria, data);
      } catch (error) {
        console.warn("Prefetch de categoria fallido", categoria, error);
      } finally {
        prefetchingRef.current.delete(categoria);
      }
    },
    [loadPreguntasByCategoria, readCache, writeCache]
  );

  useEffect(() => {
    if (!categoriasBase?.length) return;
    if (!quizStarted) return;
    if (forceAllCategories) return;
    const currentIndex = categoriasBase.indexOf(config.categoria);
    const probables = [];
    if (currentIndex >= 0) {
      if (categoriasBase[currentIndex + 1]) probables.push(categoriasBase[currentIndex + 1]);
      if (categoriasBase[currentIndex + 2]) probables.push(categoriasBase[currentIndex + 2]);
      if (categoriasBase[currentIndex - 1]) probables.push(categoriasBase[currentIndex - 1]);
    } else {
      probables.push(...categoriasBase.slice(0, 2));
    }
    const topHistoricas = getTopCategories(prefetchTopLimit);
    topHistoricas.forEach((cat) => {
      if (cat && cat !== config.categoria && !probables.includes(cat)) {
        probables.push(cat);
      }
    });
    if (!probables.length) return;

    const schedule = (fn) => {
      if (typeof window !== "undefined" && "requestIdleCallback" in window) {
        window.requestIdleCallback(() => fn(), { timeout: 1500 });
      } else {
        setTimeout(fn, 300);
      }
    };

    schedule(() => {
      probables.forEach((cat) => {
        prefetchCategoria(cat);
      });
    });
  }, [
    categoriasBase,
    config.categoria,
    forceAllCategories,
    getTopCategories,
    prefetchCategoria,
    prefetchTopLimit,
    quizStarted
  ]);

  useEffect(() => {
    let cancelled = false;
    loadTotalPreguntasCount()
      .then((total) => {
        if (cancelled) return;
        setTotalPreguntasDisponibles(typeof total === "number" ? total : 0);
      })
      .catch(() => {
        if (cancelled) return;
        setTotalPreguntasDisponibles(0);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    ensureBanco(config.categoria);
  }, [config.categoria, ensureBanco, forceAllCategories]);


  const preguntaActual = preguntasActivas[indiceActual];
  const respuestaActual = preguntaActual ? respuestas[preguntaActual.id] : undefined;
  const totalRespondidas = Object.values(respuestas).filter((resp) => resp.finalizada).length;
  const aciertos = Object.values(respuestas).filter((resp) => resp.correcto).length;
  const progreso = preguntasActivas.length
    ? (totalRespondidas / preguntasActivas.length) * 100
    : 0;
  const quizCompletado =
    preguntasActivas.length > 0 && totalRespondidas === preguntasActivas.length;
  const preguntasPendientes = useMemo(
    () =>
      preguntasActivas.filter((pregunta) => {
        const registro = respuestas[pregunta.id];
        return !registro || !registro.finalizada;
      }),
    [preguntasActivas, respuestas]
  );
  const puedeFinalizarIntento = preguntasPendientes.length === 0;
  const enUltimaPregunta =
    preguntasActivas.length > 0 && indiceActual >= preguntasActivas.length - 1;


  const iniciarSimulador = async () => {
    const banco = await ensureBanco(config.categoria);
    const vistos = new Map();
    const disponibles = [];
    const dificultadSeleccionada = config?.dificultad ?? "Todas";
    banco.forEach((pregunta) => {
      const coincideCategoria =
        config.categoria === "Todas" || pregunta.categoria === config.categoria;
      const coincideDificultad =
        dificultadSeleccionada === "Todas" || pregunta.dificultad === dificultadSeleccionada;
      if (!coincideCategoria || !coincideDificultad) return;

      const clave = `${pregunta.categoria}|${pregunta.pregunta?.trim().toLowerCase()}`;
      const preferencia = pregunta.id ? 2 : 1;
      const previo = vistos.get(clave);

      if (!previo) {
        const index = disponibles.length;
        disponibles.push(pregunta);
        vistos.set(clave, { index, preferencia });
        return;
      }

      if (preferencia > previo.preferencia) {
        disponibles[previo.index] = pregunta;
        vistos.set(clave, { index: previo.index, preferencia });
      }
    });

    if (!banco.length || !disponibles.length) {
      setAlerta("No hay preguntas disponibles con ese filtro.");
      return;
    }

    const dificultadRank = (pregunta) =>
      DIFFICULTY_ORDER[pregunta?.dificultad] ?? Number.MAX_SAFE_INTEGER;
    const ordenadas = disponibles
      .map((pregunta, index) => ({ pregunta, index }))
      .sort((a, b) => {
        const diff = dificultadRank(a.pregunta) - dificultadRank(b.pregunta);
        if (diff !== 0) return diff;
        return a.index - b.index;
      })
      .map(({ pregunta }) => pregunta);

    const objetivo =
      typeof config.cantidad === "number" && Number.isFinite(config.cantidad)
        ? config.cantidad
        : config.categoria === "Todas"
          ? totalPreguntasDisponibles || 250
          : 50;
    const fuente = config.categoria === "Todas" ? barajar([...ordenadas]) : ordenadas;
    const cantidad = Math.min(objetivo, fuente.length);
    const conjunto = fuente.slice(0, cantidad).map((item) => {
      const copia = { ...item };
      if (copia.tipo === "multiple" && Array.isArray(copia.opciones)) {
        copia.opciones = barajar(copia.opciones);
      }
      return copia;
    });

    setPreguntasActivas(conjunto);
    setIndiceActual(0);
    setRespuestas({});
    setPuntaje(0);
    setFase("quiz");
    setAlerta("");
    setQuizStarted(true);
    recordCategoryUsage(config.categoria);
  };

  const finalizarPregunta = (pregunta, payload = {}) => {
    if (!pregunta) return;
    const finalizada = Boolean(payload.correcto) || payload.motivo === "timeout";

    setRespuestas((prev) => {
      if (prev[pregunta.id]?.finalizada) return prev;
      const previo = prev[pregunta.id] || {};
      const intentos = (previo.intentos || 0) + 1;
      const incorrectos = (previo.incorrectos || 0) + (payload.correcto ? 0 : 1);
      return {
        ...prev,
        [pregunta.id]: {
          ...payload,
          finalizada,
          correcto: payload.correcto || false,
          seleccion: payload.seleccion ?? payload.codigo ?? null,
          intentos,
          incorrectos
        }
      };
    });

    if (payload.correcto) {
      setPuntaje((prev) => prev + (pregunta.puntos ?? 10));
      dispararCelebracion();
    }

    emitirFeedbackSonoro(Boolean(payload.correcto));
    updateLearningProgress(pregunta, Boolean(payload.correcto));
  };

  const emitirFeedbackSonoro = (esCorrecto) => {
    if (typeof window === "undefined") return;
    try {
      const ctx = audioCtxRef.current || new window.AudioContext();
      audioCtxRef.current = ctx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = esCorrecto ? "triangle" : "sawtooth";
      const baseFreq = esCorrecto ? 660 : 180;
      osc.frequency.value = baseFreq;
      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.1, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.45);
    } catch (error) {
      console.warn("Audio no soportado", error);
    }
  };

  const emitirSonidoFinal = () => {
    if (typeof window === "undefined") return;
    try {
      const ctx = audioCtxRef.current || new window.AudioContext();
      audioCtxRef.current = ctx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.2);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.12, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.45);
    } catch (error) {
      console.warn("Audio final no soportado", error);
    }
  };

  const dispararCelebracion = () => {
    setCelebracionActiva(true);
    setTimeout(() => setCelebracionActiva(false), 1200);
  };

  const manejarRespuesta = (valor) => {
    if (!preguntaActual) return;
    if (respuestas[preguntaActual.id]?.finalizada) return;

    const previoRegistro = respuestas[preguntaActual.id];
    const intentosPrevios = previoRegistro?.intentos ?? 0;
    const intentosActuales = intentosPrevios + 1;

    const esSlotCode =
      (preguntaActual.tipo === "codigo" && preguntaActual.modo === "slots");
    const esCodigoLibre = preguntaActual.tipo === "codigo" && !esSlotCode;
    const respuestasSlots = esSlotCode
      ? Array.isArray(preguntaActual.respuestasSlots)
        ? preguntaActual.respuestasSlots
        : []
      : [];

    const slotTemplateInfo = esSlotCode
      ? (() => {
          const partes = descomponerPlantillaCodigo(preguntaActual.plantilla || "");
          const indices = partes
            .filter((parte) => parte.tipo === "slot")
            .map((parte) => parte.indice)
            .filter((indice) => typeof indice === "number" && indice >= 0);
          const slotCount = indices.length ? Math.max(...indices) + 1 : 0;
          return { indices, slotCount };
        })()
      : { indices: [], slotCount: 0 };

    const slotIndices = slotTemplateInfo.indices;
    const slotCount = slotTemplateInfo.slotCount;

    const construirRespuestasPorIndice = () => {
      if (!esSlotCode) return [];
      if (!slotIndices.length) return [...respuestasSlots];
      const base = Array.from({ length: slotCount }, () => "");
      slotIndices.forEach((slotIndex, idx) => {
        base[slotIndex] = String(respuestasSlots[idx] ?? "");
      });
      return base;
    };

    const respuestasEsperadasPorIndice = esSlotCode ? construirRespuestasPorIndice() : [];
    const solucionSlot = esSlotCode
      ? completarPlantillaCodigo(
          preguntaActual.plantilla || "",
          respuestasEsperadasPorIndice
        )
      : null;

    let seleccionPayload = valor;
    let valorNormalizado = valor;

    if (valor && typeof valor === "object" && !Array.isArray(valor)) {
      if (Array.isArray(valor.blanks)) {
        valorNormalizado = valor.blanks;
      } else if (typeof valor.texto === "string") {
        valorNormalizado = valor.texto;
      }
      seleccionPayload = { ...valor };
    }

    const normalizarTexto = (dato) =>
      String(dato ?? "")
        .trim()
        .replace(/[.,;:]+$/u, "")
        .replace(/\s+/g, " ")
        .toLowerCase();

    const evaluar = () => {
      if (esSlotCode) {
        const seleccion = Array.isArray(valor?.respuestas) ? valor.respuestas : [];
        seleccionPayload = { modo: "slots", respuestas: [...seleccion] };

        const indicesEvaluar = slotIndices.length
          ? slotIndices
          : respuestasSlots.map((_v, index) => index);
        if (!indicesEvaluar.length) return false;

        const esperadoSecuencial = respuestasSlots;
        const obtenerEsperado = (slotIndex, idx) => {
          if (!slotIndices.length) return esperadoSecuencial[slotIndex];
          return esperadoSecuencial[idx];
        };

        return indicesEvaluar.every((slotIndex, idx) => {
          const objetivo = String(obtenerEsperado(slotIndex, idx) ?? "")
            .trim()
            .toLowerCase();
          const obtenido = String(seleccion[slotIndex] ?? "")
            .trim()
            .toLowerCase();
          return objetivo === obtenido;
        });
      }
      if (preguntaActual.tipo === "multiple") {
        if (Array.isArray(preguntaActual.respuesta)) {
          if (!Array.isArray(valor) || valor.length !== preguntaActual.respuesta.length) {
            return false;
          }
          const correctas = new Set(
            preguntaActual.respuesta.map((item) => normalizarTexto(item))
          );
          const seleccionUsuario = valor.map((item) => normalizarTexto(item));
          return seleccionUsuario.every((v) => correctas.has(v));
        }
        return normalizarTexto(valor) === normalizarTexto(preguntaActual.respuesta);
      }
      if (preguntaActual.tipo === "completar") {
        const esperado = preguntaActual.respuesta;
        const normalizar = (dato) => String(dato ?? "").trim().toLowerCase();

        if (Array.isArray(esperado)) {
          const objetivo = esperado.map(normalizar);
          let recibido;
          if (Array.isArray(valorNormalizado)) {
            recibido = valorNormalizado.map(normalizar);
          } else {
            recibido = String(valorNormalizado ?? "")
              .split(/[\n,]/)
              .map(normalizar)
              .filter(Boolean);
          }
          if (recibido.length !== objetivo.length) return false;
          return objetivo.every((meta, index) => meta === recibido[index]);
        }

        const limpio = normalizar(valorNormalizado);
        const solucion = normalizar(preguntaActual.respuesta);
        if (!limpio || !solucion) return false;
        return limpio.includes(solucion);
      }
      return false;
    };

    const esCorrecto = evaluar();
    let justificacion = construirJustificacion(preguntaActual, esCorrecto);
    if (!esCorrecto && esSlotCode && solucionSlot) {
      justificacion = `${justificacion}\nRevisa el fragmento correcto: ${solucionSlot}`.trim();
    }
    const solucionLibre =
      esCodigoLibre && typeof preguntaActual.respuesta === "string"
        ? preguntaActual.respuesta.trim()
        : "";
    const puedeRevelarCodigo =
      !esCorrecto &&
      esCodigoLibre &&
      solucionLibre &&
      intentosActuales >= MAX_INTENTOS_SIN_SOLUCION;
    if (puedeRevelarCodigo) {
      const explicacionBase = preguntaActual.explicacion
        ? `\nExplicación: ${preguntaActual.explicacion}`
        : "";
      justificacion = `${justificacion}\nRevisa este ejemplo de solución:\n${solucionLibre}${explicacionBase}`.trim();
    }

    const detalles = esSlotCode
      ? {
          modo: "slots",
          slotSolution: solucionSlot,
          respuestasEsperadas: slotIndices.length ? respuestasEsperadasPorIndice : respuestasSlots,
          respuestasUsuario: Array.isArray(seleccionPayload?.respuestas)
            ? seleccionPayload.respuestas
            : []
        }
      : (esCorrecto || puedeRevelarCodigo) && solucionLibre
      ? {
          modo: "codigo",
          solucion: solucionLibre,
          explicacion: preguntaActual.explicacion || undefined
        }
      : undefined;

    finalizarPregunta(preguntaActual, {
      correcto: esCorrecto,
      seleccion: seleccionPayload,
      detalles,
      feedback: esCorrecto
        ? esSlotCode
          ? "Respuesta correcta."
          : preguntaActual.feedbackExito || "Excelente respuesta"
        : esSlotCode
        ? "Revisa cada hueco y vuelve a intentarlo"
        : preguntaActual.feedbackError || "Sigue practicando",
      justificacion
    });
    if (autoAdvanceEnabled && esCorrecto && indiceActual + 1 < preguntasActivas.length) {
      // Auto-advance handled in UI to allow feedback delay.
    }
  };

  const manejarCodigoAprobado = ({ codigo, detalles, feedback, correcto = true, motivo }) => {
    if (!preguntaActual) return;
    if (respuestas[preguntaActual.id]?.finalizada) return;
    const esCodigoLibre = preguntaActual.tipo === "codigo" && preguntaActual.modo !== "slots";
    const solucionLibre =
      esCodigoLibre && typeof preguntaActual.respuesta === "string"
        ? preguntaActual.respuesta.trim()
        : "";

    const detallesExtendidos =
      detalles ||
      (solucionLibre
        ? {
            modo: "codigo",
            solucion: solucionLibre,
            explicacion: preguntaActual.explicacion || undefined
          }
        : undefined);

    finalizarPregunta(preguntaActual, {
      correcto,
      codigo,
      detalles: detallesExtendidos,
      motivo,
      feedback: feedback || "Todos los criterios fueron superados ✅",
      justificacion: construirJustificacion(preguntaActual, correcto)
    });
    if (autoAdvanceEnabled && correcto && indiceActual + 1 < preguntasActivas.length) {
      // Auto-advance handled in UI to allow feedback delay.
    }
  };

  const manejarEvaluacionRemota = ({
    codigo = "",
    correcta = false,
    mensaje,
    solucion,
    explicacion
  } = {}) => {
    if (!preguntaActual) return;
    if (respuestas[preguntaActual.id]?.finalizada) return;
    if (preguntaActual.tipo !== "codigo" || preguntaActual.modo === "slots") return;

    const previoRegistro = respuestas[preguntaActual.id];
    const intentosPrevios = previoRegistro?.intentos ?? 0;
    const intentosActuales = intentosPrevios + 1;

    const solucionBase =
      (solucion ?? preguntaActual.solucion ?? preguntaActual.respuesta ?? "").trim();
    const explicacionBase = explicacion ?? preguntaActual.explicacion;

    let justificacion = construirJustificacion(preguntaActual, correcta);
    const puedeRevelarCodigo =
      !correcta &&
      solucionBase &&
      intentosActuales >= MAX_INTENTOS_SIN_SOLUCION;
    if (puedeRevelarCodigo) {
      const extra = explicacionBase ? `\nExplicación: ${explicacionBase}` : "";
      justificacion = `${justificacion}\nRevisa este ejemplo de solución:\n${solucionBase}${extra}`.trim();
    }

    const detalles =
      correcta || puedeRevelarCodigo
        ? {
            modo: "codigo",
            solucion: solucionBase,
            explicacion: explicacionBase || undefined
          }
        : undefined;

    finalizarPregunta(preguntaActual, {
      correcto: Boolean(correcta),
      codigo,
      detalles,
      feedback:
        mensaje ||
        (correcta
          ? preguntaActual.feedbackExito || "¡Validación superada!"
          : preguntaActual.feedbackError || "Sigue practicando"),
      justificacion
    });
  };

  const manejarSkip = () => {
    if (!preguntaActual) return;
    if (respuestas[preguntaActual.id]?.finalizada) return;
    if (!respuestas[preguntaActual.id]?.correcto && respuestas[preguntaActual.id]) return;
    finalizarPregunta(preguntaActual, {
      correcto: false,
      seleccion: null,
      motivo: "skip",
      feedback: "Pregunta omitida",
      justificacion: construirJustificacion(preguntaActual, false)
    });
    irSiguiente();
  };

  const irAnterior = () => {
    setIndiceActual((prev) => Math.max(prev - 1, 0));
  };

  const irSiguiente = () => {
    if (!preguntasActivas.length) return;
    if (indiceActual >= preguntasActivas.length - 1) {
      setFase("revision");
      return;
    }
    setIndiceActual((prev) => Math.min(prev + 1, preguntasActivas.length - 1));
  };

  const irAIndice = useCallback(
    (target) => {
      if (!preguntasActivas.length) return;
      const limite = preguntasActivas.length - 1;
      const destino = Math.max(0, Math.min(target, limite));
      setIndiceActual(destino);
      setFase("quiz");
    },
    [preguntasActivas.length]
  );

  const mostrarRevision = useCallback(() => {
    setFase("revision");
  }, []);

  const salirRevision = useCallback(() => {
    setFase("quiz");
  }, []);

  const limpiarEstadoQuiz = () => {
    setPreguntasActivas([]);
    setRespuestas({});
    setIndiceActual(0);
    setPuntaje(0);
  };

  const finalizarQuiz = () => {
    if (!puedeFinalizarIntento) {
      setFase("revision");
      return;
    }

    const registro = {
      id: cryptoId(),
      fecha: new Date().toISOString(),
      puntaje,
      total: preguntasActivas.length,
      aciertos,
      categoria: config.categoria,
      dificultad: config.dificultad
    };

    onSaveRecord?.(registro);
    if (finishSoundEnabled) {
      emitirSonidoFinal();
    }
    setDetalleLoading(true);
    setFase("resultado");
    setTimeout(() => setDetalleLoading(false), 450);
  };

  const salirQuiz = () => {
    limpiarEstadoQuiz();
    setFase("setup");
    setAlerta("");
    setQuizStarted(false);
  };

  const reiniciar = () => {
    salirQuiz();
  };

  const detallePreguntas = preguntasActivas.map((pregunta) => ({
    ...pregunta,
    resultado: respuestas[pregunta.id]
  }));

  return {
    fase,
    setFase,
    config,
    setConfig,
    bankLoading,
    bankError,
    detalleLoading,
    preguntasActivas,
    indiceActual,
    respuestas,
    puntaje,
    alerta,
    celebracionActiva,
    categorias,
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
    learningPaths: LEARNING_PATHS,
    respuestas,
    preguntasPendientes,
    puedeFinalizarIntento,
    iniciarSimulador,
    manejarRespuesta,
    manejarCodigoAprobado,
    manejarEvaluacionRemota,
    manejarSkip,
    irAnterior,
    irSiguiente,
    irAIndice,
    enUltimaPregunta,
    mostrarRevision,
    salirRevision,
    finalizarQuiz,
    salirQuiz,
    reiniciar,
    clearCache,
    clearCategoryUsage,
    clearLearningProgress
  };
}
