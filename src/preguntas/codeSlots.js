export const CODE_SLOT_QUESTIONS = [
  {
    id: "log-09",
    category: "Logica",
    difficulty: "Basico",
    template: "if ({{slot0}} > 0)",
    correct: ["num"],
    options: ["num", "console", "input", "valor"],
    comentario: "Valida que un número sea mayor a 0"
  },
  {
    id: "log-14",
    category: "Logica",
    difficulty: "Basico",
    template: "{{slot0}}[0]",
    correct: ["array"],
    options: ["array", "lista", "obj", "const"],
    comentario: "Accede al primer elemento"
  },
  {
    id: "py-06",
    category: "Python",
    difficulty: "Basico",
    template: "{{slot0}}({{slot1}})",
    correct: ["sum", "lista"],
    options: ["sum", "lista", "list", "array", "total", "print"],
    comentario: "Suma los elementos"
  },
  {
    id: "js-get-demo",
    category: "JavaScript",
    difficulty: "Basico",
    template: "document.{{slot0}}('demo').innerHTML",
    correct: ["getElementById"],
    options: ["getElementById", "querySelector", "findHTMLById", "HTMLById"],
    comentario: "Selecciona elemento demo"
  },
  {
    id: "js-console-hola",
    category: "JavaScript",
    difficulty: "Basico",
    template: "{{slot0}}.{{slot1}}({{slot2}})",
    correct: ["console", "log", "'Hola'"],
    options: ["console", "document", "log", "write", "'Hola'", "print"],
    comentario: "Imprime Hola"
  },
  {
    id: "py-m-1",
    category: "Python",
    difficulty: "Intermedio",
    template: "[{{slot0}} for {{slot1}} in {{slot2}} if {{slot1}} > 10]",
    correct: ["x", "x", "lista"],
    options: ["x", "lista", "n", "valor", "items"],
    comentario: "Comprehension filtrando"
  },
  {
    id: "py-m-3",
    category: "Python",
    difficulty: "Intermedio",
    template: "[{{slot0}} * 2 for {{slot0}} in {{slot1}}]",
    correct: ["x", "lista"],
    options: ["x", "lista", "valor", "n"],
    comentario: "Duplica valores"
  }
];
