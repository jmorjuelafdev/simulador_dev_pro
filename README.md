# Simulador Dev Pro

Simulador web para practicar entrevistas técnicas con la **Biblioteca 2026**: bancos de preguntas actualizados, rutas de aprendizaje y controles finos para personalizar cada sesión. El sistema arma retos dinámicos por bloque, entrega retroalimentación inmediata y guarda tu progreso directamente en el navegador.

## 1. ¿Qué incluye?

- **Bloques de aprendizaje completos:**
  - Fundamentos → Lógica y Lógica 2.
  - Frontend → HTML, CSS, JavaScript, Estructura de Datos, Angular, React y API REST.
  - Backend → Python, PHP, Java.
  - Fullstack → Git y MySQL para proyectos completos.
  - Skills → Habilidades blandas (Skills y Skills 2).
- **Catálogo masivo:** hasta **50 preguntas por categoría** y opción "Todas" para practicar con el banco completo.
- **Ejercicios aplicados:** preguntas de selección única, múltiples respuestas y desafíos de código con “slots” y validaciones remotas.
- **Modo experto opcional:** auto‑avance configurable, sonido de finalización y carga offline de todos los bancos.
- **Progreso guiado:** rutas de aprendizaje por categoría, métricas visuales y registros guardados en `localStorage`.

## 2. Requisitos

- **Node.js 18** o una versión superior
- **npm** (ya viene con Node)

Comprueba tu entorno:

```bash
node --version
npm --version
```

## 3. Instalación rápida

1. Clona o descarga este repositorio.
1. Desde la carpeta del proyecto ejecuta:

```bash
npm install   # instala dependencias
npm run dev   # inicia el servidor de desarrollo
```

1. Abre el enlace que muestra Vite (habitualmente <http://localhost:5173/> o <http://localhost:5174/>).

## 4. Primer recorrido por la app

1. **Panel de configuración**
   - Elige un bloque y luego la categoría que quieres practicar.
   - "Todas" combina el banco completo.
   - Activa o desactiva auto‑avance, modo offline y sonido de finalización.

1. **Durante el simulador**
   - Responde cada pregunta; solo avanzas si aciertas.
   - Puedes dejar que el auto‑avance pase a la siguiente pregunta.
   - Observa tu progreso, puntaje y alertas en el panel lateral.

1. **Resultados y revisión**
   - Al terminar ves un resumen de aciertos, errores y el detalle de cada pregunta.
   - Puedes volver al panel, repetir preguntas pendientes o limpiar tu historial.

## 5. Personaliza tu banco

- Cada categoría vive en `src/preguntas_<categoria>.json`.
- Al editar un archivo:
  1. Guarda los cambios.
  2. Desde la interfaz, pulsa **“Limpiar cache”** o incrementa `CACHE_VERSION` en `src/hooks/useQuizEngine.js` para forzar la recarga de datos.
- Las categorías válidas están definidas en `src/preguntas/catalog.js`.

## 6. Comandos útiles

| Comando | Para qué sirve |
| --- | --- |
| `npm run dev` | Abre la aplicación en modo desarrollo. |
| `npm run build` | Genera la versión lista para producción en `dist/`. |
| `npm run preview` | Sirve el build localmente para verificarlo. |

## 7. Stack técnico

- **React 19** + **Vite 8**
- **Font Awesome** para iconos
- **CSS** puro para estilos

## 8. ¿Quieres desplegarlo?

1. Ejecuta `npm run build`.
2. Publica la carpeta `dist/` en tu hosting (ej. Netlify, Vercel, GitHub Pages).

## 9. Preguntas frecuentes

- **¿Necesito backend?** No, todo corre en el navegador.
- **¿Puedo usarlo sin conexión?** Sí, activa “Modo offline” para cachear todo el banco.
- **¿Dónde se guardan mis avances?** En `localStorage` del navegador.

---

¡Listo! Ya puedes practicar entrevistas y mantener tu propio banco de preguntas actualizado.
