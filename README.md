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
          ↓ HTTPS
       Nerio API
          ↓
    OpenAIProvider
          ↓
   OpenAI Responses API
```

En modo demostración el frontend usa `MockAIProvider` localmente, por lo que el recorrido completo funciona sin servidor, costo ni claves. En modo `api`, `ApiAIProvider` llama exclusivamente a Nerio API; el navegador nunca llama directamente a OpenAI. La configuración pública está centralizada en `src/runtime-config.js` y `src/config.js`.

Las responsabilidades están separadas en capas pequeñas:

- **Course:** el objeto local que representa el curso y su estado actual.
- **Course Context:** `buildCourseContext(course)` transforma el curso en un contrato estable con sistema educativo, plan, contenidos, próxima clase, metodología, materiales, sesiones y artifacts previos.
- **Conversation:** historial de mensajes por curso. Las acciones rápidas y los mensajes escritos pasan por el mismo `NerioService`.
- **Artifact:** documento editable producido por Nerio. Puede ser `lesson`, `worksheet`, `assessment` o `plan`.
- **Storage:** `NerioStorage` encapsula todo el acceso a `localStorage`; puede sustituirse posteriormente por un repositorio conectado a una base de datos.
- **Provider:** `MockAIProvider` conserva la demostración; `ApiAIProvider` llama a Nerio API; `OpenAIProvider` vive únicamente en el servidor y utiliza el SDK oficial con Responses API y salida JSON Schema estricta.

El contrato HTTP completo está documentado en [`docs/api-contract.md`](docs/api-contract.md). La estructura mínima del servidor está en `server/`: valida requests y responses y recibe el proveedor mediante inyección de dependencias.

### Flujo de datos

1. La interfaz entrega un mensaje y el curso activo a `NerioService`.
2. El servicio construye `CourseContext` y recupera conversación y artifact del almacenamiento.
3. El proveedor recibe `{ message, courseContext, conversation, currentArtifact }`.
4. La respuesta `{ message, artifact }` se guarda y vuelve a la conversación y a la Mesa de trabajo.

### Ejecutar el backend local

Requiere Node.js 20 o posterior.

```bash
npm install
cp .env.example .env
# Editar .env y completar OPENAI_API_KEY únicamente en el entorno local
npm run server:env
```

La API queda disponible en `http://localhost:8787`. Para comprobarla:

```bash
curl http://localhost:8787/api/health
```

Variables del servidor:

- `OPENAI_API_KEY`: obligatoria para solicitudes reales; solo backend.
- `OPENAI_MODEL`: modelo configurable, inicialmente `gpt-5-mini`.
- `OPENAI_TIMEOUT_MS`: timeout del SDK, inicialmente 45 segundos.
- `OPENAI_MAX_OUTPUT_TOKENS`: máximo de salida, inicialmente 6.000 tokens.
- `ALLOWED_ORIGINS`: orígenes CORS separados por coma.
- `PORT`: puerto HTTP asignado por Render; localmente usa 8787 si no existe.
- `HOST`: interfaz de red; usa `0.0.0.0` para Render.

Para usar el backend local desde la interfaz, editar únicamente la configuración pública de `src/runtime-config.js`:

```js
window.NERIO_RUNTIME_CONFIG = {
  MODE: 'api',
  API_BASE_URL: 'http://localhost:8787/api',
};
```

Si `MODE` es `mock` o `API_BASE_URL` está vacío, NERIO permanece en demostración y no intenta aparentar una conexión real.

### Desplegar Nerio API

Para el MVP recomendamos **Render Web Service** por su despliegue directo desde GitHub, HTTPS administrado, variables de entorno secretas y operación sencilla. `render.yaml` deja preparado el servicio:

1. Crear una cuenta/proyecto en Render y seleccionar **New Blueprint**.
2. Conectar este repositorio y aceptar `render.yaml`.
3. Cargar manualmente `OPENAI_API_KEY` como variable secreta en Render.
4. Revisar `OPENAI_MODEL` y cambiarlo si se desea otro modelo compatible.
5. Confirmar `ALLOWED_ORIGINS=https://marcelo5u4r3z.github.io`.
6. Desplegar y verificar `https://<servicio>.onrender.com/api/health`.

No guardar la clave en `render.yaml`: su entrada está marcada `sync: false` y debe completarse en el panel seguro del servicio.
El Start Command es `npm run server`, que ejecuta directamente `server/index.js`. Ese entrypoint llama a `server.listen(PORT, '0.0.0.0', ...)` al cargarse y utiliza el `PORT` que Render inyecta. La inicialización del SDK de OpenAI se difiere hasta el primer `POST /api/chat`, por lo que `/api/health` y el arranque no dependen de una llamada al proveedor.

### Conectar GitHub Pages

1. Obtener la URL HTTPS del backend desplegado.
2. Cambiar `src/runtime-config.js` en la publicación de GitHub Pages:

```js
window.NERIO_RUNTIME_CONFIG = {
  MODE: 'api',
  API_BASE_URL: 'https://<servicio>.onrender.com/api',
};
```

3. Volver a publicar GitHub Pages.
4. Abrir NERIO y comprobar que ya no aparece la etiqueta “Demostración”.
5. Probar primero `/api/health` y luego una solicitud breve desde un curso.

`API_BASE_URL` es pública por diseño; `OPENAI_API_KEY` no lo es y nunca debe copiarse a esta configuración.

### Prompt, continuidad y rigor académico

Las instrucciones se centralizan en `server/nerio-prompt.js`. Exigen usar CourseContext, no inventar contexto institucional, adaptar la profundidad al nivel, preservar el artifact completo en revisiones y utilizar español académico en documentos. Los artifacts admiten Markdown y LaTeX mediante `format: markdown-latex`.

Solo se envían los 12 mensajes recientes. El historial completo continúa localmente; esta ventana prepara el camino para incorporar memoria resumida sin enviar indefinidamente toda la conversación.

### Límites, privacidad y logs

Nerio API limita mensaje, historial, CourseContext, artifact, body HTTP, timeout y tokens de salida. CORS acepta por defecto el origen de GitHub Pages indicado y los orígenes locales de desarrollo, nunca `*`.

Los logs incluyen fecha, operación, modelo, éxito/error y latencia, pero no almacenan el contenido completo ni la clave. En esta fase CourseContext es exclusivamente académico: no se deben ingresar ni enviar nombres, calificaciones u otros datos personales de estudiantes.
Las solicitudes a Responses API usan `store: false`; esto no sustituye la revisión de las políticas y condiciones aplicables antes de utilizar datos reales.

### Ejecutar pruebas

```bash
npm test
```

Las pruebas usan clientes y proveedores simulados; nunca llaman a OpenAI ni consumen créditos.

El navegador nunca debe recibir una clave de proveedor. No se deben incluir secretos en HTML, JavaScript público, `localStorage`, GitHub Pages ni el repositorio. Todavía no hay autenticación; antes de una apertura pública más amplia será necesario agregar control de acceso y cuotas por usuario además de los límites globales actuales.

## Catálogo educativo

El flujo de creación consulta `src/education-catalog.js` en lugar de definir opciones dentro de la interfaz. El catálogo modela país, sistema, organismo, plan, carrera, especialidad o trayecto, grado o año y unidad curricular. Cada unidad ya admite metadatos de programa oficial, aunque el prototipo no descarga programas.

La primera versión incluye DGES (EBI y EMS 2023) y CFE (Profesorado de Educación Media, además de estructuras iniciales para Maestro/Profesor Técnico y Educador Social). Los identificadores estables, versiones y estados permiten agregar planes o países sin reescribir el formulario progresivo.

## Cómo probarlo

```bash
npm test
npm start
```

Luego abre `http://localhost:4173` en el navegador.
