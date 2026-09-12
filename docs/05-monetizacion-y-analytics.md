# Monetización y analytics — arquitectura

Primera capa de monetización: un flujo de leads hacia profesionales
verificados, y una capa de analítica propia que permite saber qué páginas
SEO producen negocio de verdad. Prioridad explícita: maximizar valor por
usuario sin destruir confianza — no maximizar anuncios, no bombardear con
CTAs, no simular una red de profesionales que todavía no existe.

## El funnel

```
Google → página SEO específica → calculadora → resultado → acción
                                                          ├─ lead ("solicitar presupuestos")
                                                          ├─ comparación (analizador)
                                                          └─ (futuro) afiliación
```

Cada flecha de este funnel tiene un evento de analítica asociado (ver más
abajo), para poder medir la conversión real tramo a tramo por página de
entrada, no solo el tráfico agregado.

## "Compara presupuestos de profesionales" (primera monetización)

### Por qué esta forma y no otra

- **No se generan leads falsos ni se simulan proveedores.** `professionals`
  se crea vacía y sigue vacía hasta que exista una red real y verificada.
  `findMatchingProfessionals` devuelve honestamente `[]` hoy — nunca un
  match inventado — y está cubierto por un test de integración
  (`lib/leads/repository.integration.test.ts`) que lo comprueba contra
  Postgres real, incluyendo que profesionales `pendiente` o `isActive:
  false` nunca cuentan como cobertura.
- **El lead se guarda siempre**, tenga o no cobertura hoy. Si no hay ningún
  profesional verificado para ese servicio/región, el lead queda con
  `status: "sin_cobertura"` en vez de perderse — así, el día que exista
  cobertura real, hay histórico de demanda no atendida para decidir dónde
  reclutar profesionales primero.
- **El CTA está colapsado por defecto** (`LeadRequestCard`): un botón
  secundario, una sola vez por página de resultado/comparación. Solo se
  convierte en formulario si el usuario decide pedirlo explícitamente. El
  mensaje tras enviar es deliberadamente honesto sobre que la red de
  profesionales todavía se está construyendo — nunca promete un match
  instantáneo que hoy no puede cumplir.

### Modelo de datos (`db/schema.ts`)

```
professionals                     (vacía hasta que exista red real;
                                    verification_status: pendiente |
                                    verificado | rechazado)
professional_service_areas        (a qué servicio+región atiende cada
                                    profesional; region_id null = toda
                                    España)
leads -> estimate_id              (siempre referencia una Estimate)
      -> comparison_id            (opcional: si el lead viene de comparar
                                    un presupuesto ya recibido)
      -> service_type_id/region_id (heredados de la Estimate, para poder
                                     hacer el matching sin re-preguntarlos)
      -> status                   (nuevo | en_revision | contactado |
                                    sin_cobertura | cerrado)
      -> consent_version/consent_accepted_at
```

### Consentimiento (RGPD)

`LEAD_CONSENT_VERSION` (`lib/leads/validation.ts`) versiona el texto exacto
que el usuario aceptó. Si el texto cambia en el futuro, se sube la
versión — nunca se edita el texto sin cambiar la constante — para que cada
lead guardado pueda demostrar exactamente qué aceptó en su momento, aunque
la web muestre después un texto distinto. La UX explica junto al checkbox
por qué se piden esos datos concretos (contacto, para que un profesional
pueda responder) en vez de limitarse a un enlace a la política de
privacidad.

### Preparado para: marketplace, venta de leads, afiliación, SaaS premium

- `leads.status` y `leads.assigned_professional_id` ya modelan el ciclo de
  vida de un lead asignado a un profesional concreto — la pieza que falta
  para un marketplace es una interfaz de gestión sobre estas mismas tablas,
  no un cambio de esquema.
- `professional_service_areas` ya separa cobertura por servicio y por
  región de forma independiente por profesional — la pieza que falta para
  vender leads segmentados por zona es filtrar sobre esta tabla, ya
  soportado por `findMatchingProfessionals`.
- Nada de esto se ha construido todavía (páginas de alta de profesional,
  panel de gestión, facturación): solo la estructura de datos que lo hace
  posible sin una reescritura.

## Analítica: taxonomía de eventos

`lib/analytics/events.ts` declara una unión cerrada de tipos de evento — un
evento nuevo se añade ahí, nunca se inventa desde un componente:

| Evento | Cuándo se dispara |
|---|---|
| `page_view` | Al montar una página de contenido SEO (home, hub de servicio, precios, comparativas, guías, preguntas) — `PageViewTracker` |
| `calculator_start` | Al montar el asistente (calculadora o analizador) |
| `calculator_step` | Cada vez que el usuario avanza/retrocede de paso dentro del asistente |
| `estimate_result_view` | Al montar `/resultado/[id]` |
| `comparison_result_view` | Al montar `/comparar/[id]` |
| `lead_form_opened` | Al expandir el formulario de `LeadRequestCard` |
| `lead_submitted` | Al guardar un lead con éxito (servidor, dentro de `submitLeadAction`, no en el cliente — así nunca se registra un envío que en realidad falló) |
| `wizard_abandoned` | `beforeunload` del asistente si el usuario no ha llegado a completar el envío |
| `internal_search` | Declarado para cuando exista una búsqueda interna real; hoy no se dispara porque no existe — declararlo sin usarlo es honesto, construir un buscador falso solo para poder dispararlo no lo sería |

### Cómo viaja un evento

- Cliente: `lib/analytics/track.ts` mantiene un id de sesión y una
  `entryPath` (primera ruta vista) en `sessionStorage` — sin cookies, sin
  terceros. `trackEvent()` envía por `navigator.sendBeacon` (para que
  sobreviva a un cierre de pestaña) con `fetch(..., {keepalive: true})`
  como fallback, y nunca lanza: un fallo de analítica no debe romper la UX.
- Servidor: `app/api/events/route.ts` valida el payload con Zod (incluye
  `sendBeacon`, que puede llegar sin `Content-Type` correcto, por eso se
  parsea el texto crudo) y lo persiste con `lib/analytics/repository.ts`.
  Los eventos que solo el servidor puede confirmar de verdad
  (`lead_submitted`) se registran desde el propio Server Action, no desde
  el cliente.

## "Qué páginas SEO producen dinero" — sin inventar cifras

`getLandingPageFunnelStats()` (`lib/analytics/repository.ts`) agrupa por
`entryPath` (atribución de primer toque) y calcula, por página de entrada:
visitas, inicios de calculadora, resultados vistos, leads, y `leadRate`
(leads / visitas).

**Decisión deliberada:** esta función NO calcula un "revenue estimado por
landing page" en euros. Multiplicar `leads` por un valor de venta inventado
sería fabricar un dato — la misma regla que ya rige los precios de
instalación rige aquí. `leadRate` es una tasa de conversión real, medible
hoy; el día que exista un acuerdo comercial real con profesionales que fije
qué vale un lead, ese valor se multiplica en el punto de consumo del
informe, no se hardcodea en esta función.

## Legal

`/legal/privacidad` y `/legal/cookies` se han reescrito para describir con
precisión lo que el sistema hace hoy: qué se guarda al calcular/comparar
(sin datos identificativos), qué se guarda solo si el usuario solicita
presupuestos (nombre/email/teléfono/descripción, con base legal de
consentimiento explícito), y cómo funciona la analítica de sesión sin
cookies ni terceros (y por qué eso no requiere hoy un banner de
consentimiento LSSICE). Siguen marcadas como borrador pendiente de
revisión legal formal antes de cualquier lanzamiento real.

## Tests

- `lib/leads/validation.test.ts` — Zod puro (consentimiento obligatorio,
  email válido, normalización de campos opcionales vacíos a `undefined`).
- `lib/leads/repository.integration.test.ts` — contra Postgres real
  (se salta sin `DATABASE_URL`): sin profesionales, `findMatchingProfessionals`
  devuelve `[]`; profesionales `pendiente`/inactivos nunca cuentan;
  matching correcto por región y por cobertura "toda España". Limpia sus
  propias filas al terminar para no dejar `professionals` con datos falsos.
- `lib/analytics/repository.integration.test.ts` — contra Postgres real:
  inserta eventos con un `entryPath` único por ejecución, verifica que el
  funnel los agrega correctamente y que `leadRate` nunca se inventa para
  una página sin visitas. Limpia sus propias filas al terminar.

## Verificación manual (QA)

Flujo completo probado con Playwright contra el servidor de desarrollo y
Postgres real: home → calculadora → resultado → abrir CTA de leads →
enviar formulario → confirmación honesta ("todavía estamos construyendo la
red... no inventamos contactos que no existen") → lead guardado en
Postgres con `status: sin_cobertura` (correcto: no hay profesionales
sembrados) → eventos de analítica correspondientes visibles en
`analytics_events`.
