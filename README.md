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
- `src/education-catalog.js`: catálogo educativo versionado e independiente de la interfaz.
- `src/generator.js`: datos demo y operaciones puras del dominio del curso.
- `src/app.js`: navegación, pantallas y persistencia local del prototipo.
- `tests/generator.test.js`: pruebas de las operaciones principales.

No usa IA real, autenticación, backend ni base de datos. Los cambios se conservan en `localStorage` y la selección de archivos es únicamente una simulación local; ningún archivo se envía ni se procesa.

## Catálogo educativo

El flujo de creación consulta `src/education-catalog.js` en lugar de definir opciones dentro de la interfaz. El catálogo modela país, sistema, organismo, plan, carrera, especialidad o trayecto, grado o año y unidad curricular. Cada unidad ya admite metadatos de programa oficial, aunque el prototipo no descarga programas.

La primera versión incluye DGES (EBI y EMS 2023) y CFE (Profesorado de Educación Media, además de estructuras iniciales para Maestro/Profesor Técnico y Educador Social). Los identificadores estables, versiones y estados permiten agregar planes o países sin reescribir el formulario progresivo.

## Cómo probarlo

```bash
npm test
npm start
```

Luego abre `http://localhost:4173` en el navegador.
