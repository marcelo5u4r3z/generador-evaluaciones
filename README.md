# Aula — ayudante personal para docentes

Prototipo navegable de un espacio de trabajo para docentes, organizado alrededor de cada curso.

## Qué se puede probar

- Crear y recorrer cursos.
- Consultar avance, contenidos y próximas clases.
- Agregar archivos de forma local a una biblioteca simulada.
- Conversar con un ayudante simulado y generar clases, prácticos, evaluaciones o replanificaciones.
- Editar, guardar localmente e imprimir los borradores.
- Registrar una clase y actualizar el avance del curso.

- `index.html`: punto de entrada de la aplicación.
- `src/styles.css`: sistema visual responsive y reglas de impresión.
- `src/generator.js`: datos demo y operaciones puras del dominio del curso.
- `src/app.js`: navegación, pantallas y persistencia local del prototipo.
- `tests/generator.test.js`: pruebas de las operaciones principales.

No usa IA real, autenticación, backend ni base de datos. Los cambios se conservan en `localStorage` y la selección de archivos es únicamente una simulación local; ningún archivo se envía ni se procesa.

## Cómo probarlo

```bash
npm test
npm start
```

Luego abre `http://localhost:4173` en el navegador.
