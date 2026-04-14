# Simulador Dev Pro

Una aplicación web para entrenar habilidades técnicas mediante un simulador de preguntas categorizadas. El banco avanza progresivamente en dificultad dentro de cada categoría y ofrece ejercicios de opción múltiple y código con slots (sin editor de código).

## Estado actual (Abr 2026)

- **Categorías activas:** Lógica, JavaScript, Python, Fullstack y Skills.
- **Sesiones fijas:** cada categoría carga hasta 50 preguntas; la opción "Todas" arma una sesión de hasta 250.
- **Sin editor de código:** todas las preguntas de completar/código usan **slots** con opciones (selección única).
- **Auto‑avance configurable:** solo 2s y 5s (por defecto 2s) y se guarda en `localStorage`.
- **Sin límite de tiempo en UI:** las preguntas pueden tener `timeLimit`, pero no hay countdown ni bloqueo por tiempo.
- **Debe acertar para avanzar:** si la respuesta es incorrecta, se muestra “Inténtalo de nuevo”.
- **Caché versionada:** `CACHE_VERSION` en `v13` para forzar recargas del banco.
- **Bancos actualizados:** las preguntas de cada categoría están normalizadas y ordenadas por `id`.

## Tecnologías utilizadas

- **React 19** + **Vite 8** para el frontend.
- **CSS** / HTML estándar para la UI (sin frameworks de estilo adicionales).

## Estructura relevante

- `src/`: componentes React, hooks y bancos de preguntas (JSON por categoría).
- `src/hooks/useQuizEngine.js`: motor que gestiona estados del quiz, dificultad progresiva y cache local.
- `src/preguntas_*.json`: bancos de preguntas por categoría (por ejemplo `src/preguntas_skills.json`).

## Requisitos previos

- Node.js 18+
- npm 9+ (se instala con Node por defecto)

## Instalación

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar frontend
npm run dev
```

Scripts disponibles:

| Script | Comando | Descripción |
| --- | --- | --- |
| `dev` | `vite` | Arranca el frontend en modo desarrollo (<http://localhost:5173>). |
| `build` | `vite build` | Genera la versión estática lista para producción en `dist/`. |
| `preview` | `vite preview` | Sirve el build localmente para pruebas. |

> **Nota**: El proyecto es 100% frontend; no requiere backend para evaluación.

## Uso de la interfaz

1. **Ingreso y preconfiguración**
   - Inicia sesión con `npm run dev` y abre <http://localhost:5173>.
   - El panel de configuración aparece por defecto. Allí puedes:
     - Elegir la categoría (`Todas`, `Logica`, `JavaScript`, `Python`, `Fullstack`, `Skills`).
     - Revisar el resumen de cache: entradas y tamaño. El botón **“Limpiar cache”** borra los bancos guardados en `localStorage`.
     - Activar/desactivar sonido de acierto, modo offline y auto‑avance (2s o 5s).
     - Ajustar la velocidad de auto‑avance y reiniciar el progreso de aprendizaje si lo deseas.

2. **Durante el quiz**
   - Se generan hasta 50 preguntas por categoría (250 al elegir “Todas”), ordenadas por dificultad progresiva.
   - Para cada pregunta:
     - Los tipos **múltiple** muestran opciones tipo radio. Solo puedes continuar si aciertas.
     - Los tipos **slots/código** requieren arrastrar o seleccionar tokens para construir la respuesta y presionar *Comprobar*.
   - Puedes avanzar manualmente con “Siguiente” o dejar que el auto‑avance lleve el ritmo tras cada acierto.
   - El panel lateral muestra progreso, puntaje, racha de aciertos y alertas (por ejemplo, si una pregunta queda pendiente).

3. **Finalizar y revisar**
   - Cuando respondes todas las preguntas activas, se muestra la pantalla de resultados con:
     - Puntaje total, aciertos/errores y tiempo invertido estimado.
     - Tabla con cada pregunta, tu respuesta, la correcta y un indicador de estado (Correcta, Revisar, Pendiente).
   - Desde aquí puedes:
     - Volver al panel inicial con **Reiniciar simulador**.
     - Entrar al modo de revisión para repetir preguntas marcadas como “Revisar”.
     - Limpiar cache y progreso si quieres forzar nuevas preguntas modificadas.

> **Tip para editores de bancos**: tras modificar un `preguntas_*.json` en desarrollo, limpia el cache desde el panel o incrementa `CACHE_VERSION` en `useQuizEngine.js` para que el simulador recargue los datos frescos.

## Dependencias principales

Dependencias runtime:

- `react`, `react-dom`

Dependencias de desarrollo:

- `vite`
- `@vitejs/plugin-react`

Ejecuta `npm ls` para ver el árbol completo.

## Despliegue en Netlify

1. **Build estático**
   - Configura en Netlify:
     - *Base directory*: raíz del repo (vacío).
     - *Build command*: `npm run build`.
     - *Publish directory*: `dist`.

2. **Pruebas posteriores al deploy**
   - Verifica que las preferencias (auto‑avance, filtros, progreso) se guarden en `localStorage`.
   - Comprueba la reproducción de audio (sonidos del quiz) y la persistencia en `localStorage` desde el navegador.

## Personalización y mantenimiento

- **Bancos de preguntas**: editar archivos `src/preguntas_*.json`. Las categorías deben coincidir con las permitidas por `CATEGORY_LIST` en `src/preguntas/catalog.js`.
- **Versionado de caché**: `CACHE_VERSION` en `useQuizEngine.js` fuerza la invalidación cuando cambian los bancos.
- **IDs en Skills**: el banco `src/preguntas_skills.json` usa IDs `sk-*` (ejemplo: `sk-1`). Si se renumeran o cambian los IDs, se reinicia el progreso asociado en `localStorage`.

---
¡Listo! El proyecto está documentado y preparado para desarrollarse localmente o desplegarse como SPA en Netlify.
