# Preparación para producción

Repaso de seguridad, privacidad, confianza y estados de error antes de un
lanzamiento real. Como en el resto del proyecto: nada de esto inventa
texto legal ni promete algo que el producto no hace — ver la nota de cada
sección.

## Seguridad

### Mensajes de error seguros

Antes, las Server Actions (`lib/estimation/actions.ts`, `lib/leads/actions.ts`)
devolvían `err.message` tal cual al cliente en el `catch`. Para un error de
dominio (p. ej. `MissingPricingDataError`) eso está bien: el mensaje se
escribió pensando en que lo lea un usuario. Pero para cualquier error no
previsto (un fallo de conexión a Postgres, un bug), `err.message` puede
llevar detalles internos que nadie debería ver desde el navegador.

`lib/errors/safe-message.ts` centraliza la decisión: solo dos clases de
error (`MissingPricingDataError`, `InvalidEstimationInputError`) pasan su
mensaje al cliente. Cualquier otro error se registra con `console.error`
en el servidor (nunca llega al cliente) y se devuelve un mensaje genérico,
clasificado además con un `errorKind` (`validation | missing_data |
unavailable | unknown`) para que la UI pueda mostrar una explicación
distinta según el caso (ver más abajo, "Estados de error").

### Rate limiting

Sin Redis: `lib/security/rate-limit.ts` implementa un contador de ventana
fija en la propia Postgres (tabla `rate_limit_buckets`), con un único
`INSERT ... ON CONFLICT DO UPDATE` atómico — sin condición de carrera entre
leer y escribir. Aplicado a:

- `submitLeadAction` — 5 solicitudes por IP y hora. Es la acción que más
  puede costar en abuso (escribe en `leads`, y en el futuro activaría un
  contacto real con profesionales).
- `app/api/events/route.ts` — 60 eventos por IP y minuto. Generoso (una
  sesión real dispara varios eventos), solo corta un flood.

`clientIpFromHeaders()` lee `x-forwarded-for`/`x-real-ip` (las cabeceras
que pone cualquier proxy/balanceador estándar delante de Next.js). Sin
proxy delante (desarrollo local) cae a una clave fija — agrupa el tráfico
local bajo un cupo común en vez de desactivar el límite.

### Honeypot en el formulario de leads

Campo `website` oculto (`sr-only` + `aria-hidden` + fuera del tab order)
en `LeadRequestCard`. Un bot que autorrellena formularios normalmente lo
completa; una persona nunca lo ve. Si llega relleno, `submitLeadAction`
finge éxito sin escribir nada — no se le da a quien lo dispara ninguna
pista de que se ha detectado.

### Cabeceras HTTP

`next.config.ts` añade `X-Frame-Options: DENY` (nada en este sitio necesita
enmarcarse en un iframe ajeno), `X-Content-Type-Options: nosniff`,
`Referrer-Policy: strict-origin-when-cross-origin` (no filtra la URL
completa como referrer al salir a un enlace externo — por ejemplo, una
fuente citada) y una `Permissions-Policy` que deniega cámara/micro/geo
(ninguna página los usa). `poweredByHeader: false` ya estaba desactivado
desde la auditoría SEO.

### Validación server-side y sanitización

Ya establecido en turnos anteriores y verificado de nuevo aquí: todo
input de usuario pasa por un esquema Zod en el servidor antes de tocar la
base de datos (nunca se confía en la validación del cliente). El único
HTML no generado por React (`JsonLd`) escapa `</script>` explícitamente.
No hay ningún uso de `dangerouslySetInnerHTML` fuera de ese caso.

### Secretos y variables de entorno

`.env*` está en `.gitignore` (con excepción explícita de `.env.example`,
que no lleva ningún valor real). Revisado el historial de git: nunca se
ha commiteado un `.env`/`.env.local` real. `DATABASE_URL` solo se lee para
pasarla al `Pool` de `pg`; nunca se imprime en un log. No hay ninguna
clave de API, contraseña ni token hardcodeado en el código — no hay
ningún servicio de terceros integrado todavía.

### Logs

Revisados todos los `console.*` del proyecto: los únicos en código de
aplicación son el `console.error` de `safe-message.ts` (el error interno,
nunca datos de usuario) y los `console.error` de los boundaries de error
de React (`error.tsx`/`global-error.tsx`, estándar de Next.js). Ningún log
imprime email, teléfono, ni el contenido de un formulario.

## Privacidad

Páginas legales completas y enlazadas entre sí desde el footer de todo el
sitio: `/legal/privacidad`, `/legal/cookies`, `/legal/terminos` (nueva),
`/legal/aviso-legal`, y `/contacto`. Todas marcadas explícitamente como
**borrador pendiente de revisión legal formal** — la instrucción de "no
inventar textos legales" se cumple describiendo con precisión lo que el
sistema hace hoy (qué se guarda, cuándo, con qué base legal), no redactando
cláusulas que aparenten ser definitivas sin que un profesional del derecho
las haya revisado.

`/legal/terminos` (nueva) cubre: qué es el servicio y qué no es, uso
aceptable, la solicitud de presupuestos a profesionales (remite a
privacidad para el detalle de datos), disponibilidad, propiedad del
contenido, y contacto. `/legal/aviso-legal` se amplió con una sección de
límite de responsabilidad y enlaces cruzados a términos/privacidad/contacto.

## Confianza

- **Metodología** (`/metodologia`) y **fuentes** (`/fuentes`) ya existían;
  se añadió una fecha visible: `getLastDataUpdateDate()` calcula la fecha
  más reciente de `data_sources.retrieved_on` (la fecha real en la que se
  verificó cada dato, nunca una fecha inventada) y se muestra de forma
  destacada en `/fuentes`, con una referencia desde `/metodologia`.
- **Explicación de estimaciones y limitaciones**: ya cubierto en
  `/metodologia` (los tres niveles de confianza A/B/C) y en el propio
  resultado (desglose por partidas con su letra de confianza).
- **Disclaimer claro**: presente en `/legal/aviso-legal`, en el pie de
  `/resultado/[id]` y `/comparar/[id]` ("esto no es una tasación
  profesional"), y en `/legal/terminos`.
- **Revisión de tono**: repasado el copy de home, metodología, aviso legal
  y las páginas de resultado — consistentemente en el registro "te
  ayudamos a entender un presupuesto", nunca "sabemos el precio exacto".
  Sin una sola instancia de lenguaje de autoridad inventada (verificado
  por grep: cero coincidencias de frases tipo "precio exacto",
  "garantizamos", "te aseguramos").

## Estados de error

| Estado | Dónde | Cómo se ve |
|---|---|---|
| Error genérico (no previsto) | `app/error.tsx` | Boundary de segmento, con marca, botón "Reintentar" (prop `retry` — en Next 16.3 es la recomendada frente a `reset`, ver `error.tsx`) |
| Fallo del layout raíz | `app/global-error.tsx` | Su propio `<html>/<body>`, CSS inline (Next no carga globals.css aquí) |
| Página/recurso no encontrado | `app/not-found.tsx` | Cubre explícitamente enlace roto, resultado ya no válido, y categoría todavía no disponible |
| Formulario inválido | Zod + `ActionResult.errorKind: "validation"` | Mensaje bajo el formulario (Wizard, LeadRequestCard) |
| Datos insuficientes | `MissingPricingDataError` → `errorKind: "missing_data"` | `ErrorNotice` con tono info en el Wizard: "No tenemos datos suficientes para tu caso exacto" |
| Servicio no disponible | Errores de conexión → `errorKind: "unavailable"` (también el propio rate limit) | `ErrorNotice` con tono warning: "Servicio no disponible ahora mismo" |
| Resultado imposible | `isPlausibleRange()` en `/resultado/[id]` y `/comparar/[id]` | `ImpossibleResultNotice`: nunca se pinta un rango negativo o invertido, aunque la fila esté corrupta |

`isPlausibleRange()` es una última barrera defensiva, no la primera línea
de defensa: el motor de estimación y sus tests ya garantizan que esto no
ocurre en circunstancias normales. Existe para que un dato corrupto (edición
manual, un bug futuro) se traduzca en un estado de error explícito, nunca
en una UI con números sin sentido.

## Verificación

`tsc --noEmit`, `eslint .`, `vitest run` (108 tests, incluyendo los nuevos
para rate limiting, `clientIpFromHeaders` e `isPlausibleRange`) y
`next build` — todos limpios tras cada cambio de esta sección.
