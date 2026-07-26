# NERIO — Tu agente docente

Prototipo navegable de un agente personal para docentes, organizado alrededor de cada curso.

## Qué se puede probar

- Crear y recorrer cursos.
- Consultar avance, contenidos y próximas clases.
- Agregar archivos de forma local a una biblioteca simulada.
- Conversar con Nerio y preparar clases, prácticos, evaluaciones o replanificaciones de demostración.
- Editar, guardar localmente e imprimir los borradores.
- Registrar una clase y actualizar el avance del curso.

- `index.html`: punto de entrada de la aplicación.
- `src/styles.css`: sistema visual responsive y reglas de impresión.
- `src/nerio-mark.svg`, `src/nerio-wordmark.svg` y `src/nerio-lockup.svg`: sistema de marca escalable.
- `src/education-catalog.js`: catálogo educativo versionado e independiente de la interfaz.
- `src/generator.js`: datos demo y operaciones puras del dominio del curso.
- `src/app.js`: navegación, pantallas y persistencia local del prototipo.
- `tests/generator.test.js`: pruebas de las operaciones principales.

No usa IA real, autenticación, backend ni base de datos. Los cambios se conservan en `localStorage` y la selección de archivos es únicamente una simulación local; ningún archivo se envía ni se procesa.

## Arquitectura de NERIO

```text
Frontend estático (GitHub Pages)
          ↓
       Nerio API
          ↓
      AI Provider
```

En modo demostración el frontend usa `MockAIProvider` localmente, por lo que el recorrido completo funciona sin servidor, costo ni claves. La configuración está centralizada en `src/config.js` y el modo inicial es `mock`.

Las responsabilidades están separadas en capas pequeñas:

- **Course:** el objeto local que representa el curso y su estado actual.
- **Course Context:** `buildCourseContext(course)` transforma el curso en un contrato estable con sistema educativo, plan, contenidos, próxima clase, metodología, materiales, sesiones y artifacts previos.
- **Conversation:** historial de mensajes por curso. Las acciones rápidas y los mensajes escritos pasan por el mismo `NerioService`.
- **Artifact:** documento editable producido por Nerio. Puede ser `lesson`, `worksheet`, `assessment` o `plan`.
- **Storage:** `NerioStorage` encapsula todo el acceso a `localStorage`; puede sustituirse posteriormente por un repositorio conectado a una base de datos.
- **Provider:** `MockAIProvider` implementa el contrato `generate(request)`. `ApiAIProvider` es el adaptador del navegador para llamar a `POST /api/chat` cuando exista un backend desplegado.

El contrato HTTP completo está documentado en [`docs/api-contract.md`](docs/api-contract.md). La estructura mínima del servidor está en `server/`: valida requests y responses y recibe el proveedor mediante inyección de dependencias.

### Flujo de datos

1. La interfaz entrega un mensaje y el curso activo a `NerioService`.
2. El servicio construye `CourseContext` y recupera conversación y artifact del almacenamiento.
3. El proveedor recibe `{ message, courseContext, conversation, currentArtifact }`.
4. La respuesta `{ message, artifact }` se guarda y vuelve a la conversación y a la Mesa de trabajo.

### Cómo pasar de MockAIProvider a un proveedor real

1. Implementar en el servidor una clase que cumpla `AIProvider.generate`.
2. Leer la clave del proveedor **solo desde variables de entorno del servidor**.
3. Conectar esa implementación con el handler de `POST /api/chat`.
4. Cambiar `mode` de `mock` a `api` en la configuración de despliegue del frontend y definir la URL pública de Nerio API.

El navegador nunca debe recibir una clave de proveedor. No se deben incluir secretos en HTML, JavaScript público, `localStorage`, GitHub Pages ni el repositorio. Todavía no hay autenticación, por lo que una API real también deberá incorporar controles de acceso, límites de uso y validación de origen antes de exponerse públicamente.

## Catálogo educativo

El flujo de creación consulta `src/education-catalog.js` en lugar de definir opciones dentro de la interfaz. El catálogo modela país, sistema, organismo, plan, carrera, especialidad o trayecto, grado o año y unidad curricular. Cada unidad ya admite metadatos de programa oficial, aunque el prototipo no descarga programas.

La primera versión incluye DGES (EBI y EMS 2023) y CFE (Profesorado de Educación Media, además de estructuras iniciales para Maestro/Profesor Técnico y Educador Social). Los identificadores estables, versiones y estados permiten agregar planes o países sin reescribir el formulario progresivo.

## Cómo probarlo

```bash
npm test
npm start
```

Luego abre `http://localhost:4173` en el navegador.
