# Contrato de Nerio API

## `POST /api/chat`

El navegador envía contexto estructurado, nunca credenciales del proveedor.

### Request

```json
{
  "message": "Preparame la próxima clase.",
  "courseContext": {
    "courseId": "profesorado-matematica-3",
    "course": {},
    "education": {},
    "planning": {},
    "teaching": {},
    "materials": [],
    "sessions": [],
    "previousArtifacts": []
  },
  "conversation": [
    { "role": "user", "text": "...", "createdAt": "..." },
    { "role": "assistant", "text": "...", "createdAt": "..." }
  ],
  "currentArtifact": null
}
```

### Response exitosa

```json
{
  "message": "Preparé una propuesta para trabajar distribuciones continuas.",
  "artifact": {
    "id": "artifact-123",
    "type": "lesson",
    "title": "Clase — Distribuciones continuas",
    "course": "Probabilidad y Estadística II",
    "content": "...",
    "format": "markdown-latex",
    "createdAt": "2026-07-26T12:00:00.000Z",
    "updatedAt": "2026-07-26T12:00:00.000Z"
  }
}
```

`artifact` puede ser `null`. Los tipos admitidos son `lesson`, `assessment`, `worksheet` y `plan`.
El formato inicial es `markdown-latex`: texto Markdown con expresiones LaTeX entre `$...$` o `$$...$$`. El editor actual conserva ese contenido como texto editable; un render matemático enriquecido puede incorporarse después sin cambiar el contrato.

### Errores

- `400 invalid_request`: contrato incompleto o inválido.
- `503 provider_unavailable`: el proveedor no respondió correctamente.
- `413`: el body HTTP excede el máximo permitido.

La API nunca devuelve stack traces ni detalles internos al navegador.

## Límite de seguridad

Las claves de proveedores viven **exclusivamente en variables de entorno del servidor**. El adaptador de proveedor real se implementará debajo de `server/providers/`; ninguna clave, SDK privilegiado o variable secreta debe importarse desde `src/`.

## Límites iniciales

- Mensaje: 4.000 caracteres.
- Historial enviado: 12 mensajes recientes.
- CourseContext serializado: 48 KiB.
- Artifact activo: 30.000 caracteres.
- Body HTTP: 128 KiB.

El servidor reduce CourseContext a campos académicos conocidos y no acepta datos personales de estudiantes como parte del contrato. El historial completo puede permanecer local, pero solo la ventana reciente se envía al proveedor. Más adelante esta ventana podrá combinarse con una memoria resumida.
