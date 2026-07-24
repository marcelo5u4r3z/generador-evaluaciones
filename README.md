# Generador de evaluaciones

MVP web para docentes que permite crear un borrador de evaluación desde datos básicos de la clase.

## Arquitectura elegida

El proyecto usa una arquitectura estática y sencilla:

- `index.html`: estructura principal de la aplicación.
- `src/styles.css`: estilos visuales responsivos y reglas de impresión.
- `src/generator.js`: lógica pura para separar temas, distribuir puntaje y crear preguntas sugeridas.
- `src/app.js`: conexión entre el formulario, la vista previa y el botón de impresión.
- `tests/generator.test.js`: pruebas de la lógica del generador con Node.js.

No requiere base de datos, backend, servicios pagos ni instalación de dependencias.

## Cómo probarlo

```bash
npm test
npm start
```

Luego abre `http://localhost:4173` en el navegador.
