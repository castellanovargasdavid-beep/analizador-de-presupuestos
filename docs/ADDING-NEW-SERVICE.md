# Cómo añadir un nuevo servicio

Presupuesto Claro está organizado como **categoría → profesión → servicio**.
Una categoría (p. ej. "Instalaciones") agrupa profesiones (p. ej.
"Fontanero"), y cada profesión agrupa servicios concretos (p. ej. "Reparar
una fuga", "Cambiar un grifo"). Un servicio puede existir en tres estados
de madurez, y **no hace falta construir una calculadora para publicar
algo útil**:

| Estado | Qué ve el usuario | Cuándo usarlo |
|---|---|---|
| `proximamente` | Página informativa real + formulario "avísame" | Todavía no hay datos fiables para estimar un precio |
| `solo_solicitud` | Formulario de solicitud de presupuesto, sin rango de precio | Hay demanda real pero no una metodología de cálculo validada |
| `disponible` | Calculadora completa + comparación de presupuesto + solicitud | Hay una regla de precio con fuentes citadas y confianza razonable |

**No se salta directamente a `disponible`**. El camino normal es
`proximamente` → (validar demanda real, ver `docs/COMMERCIAL-VALIDATION-EXPERIMENT.md`)
→ `solo_solicitud` (si hace falta reunir más leads reales antes de fijar
precios) → `disponible` (cuando exista una regla de precio con fuentes).

## Paso 0 — Catalogar el servicio (siempre, sea cual sea el estado final)

Esto es lo único que hace falta para que un servicio nuevo aparezca en
`/servicios`, `/profesiones` y el buscador — **sin escribir ninguna
calculadora**. Dos formas:

### Opción A — desde `/admin` (recomendado para contenido)

1. `/admin/categorias` — crea la categoría si no existe ya.
2. `/admin/profesiones` — crea la profesión dentro de esa categoría. Escribe
   una descripción real (qué cubre, qué no) — nunca relleno genérico. Déjala
   en `borrador` hasta que el texto esté listo; pásala a `publicado` cuando
   quieras que tenga página pública.
3. `/admin/servicios` — crea el servicio, asígnale la profesión, elige su
   `availabilityStatus` (normalmente `proximamente` al principio).

### Opción B — vía script (para sembrar varios de golpe)

Ver `db/seed-catalog.ts` como referencia: es **aditivo** (nunca borra nada
existente) e idempotente (comprueba por slug antes de insertar). Sigue el
mismo patrón (`ensureCategory` / `ensureProfession` / `ensureServiceType`)
para añadir un lote nuevo.

Ejemplo real — añadir "Fontanero → Desatascar una tubería" (todavía sin
calculadora):

```ts
const instalaciones = await ensureCategory("instalaciones", "Instalaciones", "...", "wrench");
const fontanero = await ensureProfession(instalaciones.id, "fontanero", "Fontanero", "...", "wrench");
await ensureServiceType(
  instalaciones.id,
  fontanero.id,
  "desatascar-una-tuberia",
  "Desatascar una tubería",
  "Desatasco de una tubería obstruida.",
  "proximamente",
);
```

Con esto ya es honesto y funcional: aparece en el catálogo con estado
"Próximamente" y un formulario de aviso de interés
(`components/catalog/NotifyMeForm.tsx`, acción `notifyMeAction` en
`lib/catalog/actions.ts`) — sin inventar ningún precio.

## Paso 1 — Pasar a `solo_solicitud` (opcional, antes de tener calculadora)

Cambia `availabilityStatus` a `solo_solicitud` desde `/admin/servicios`
(o en el seed). La página de la profesión (`app/profesiones/[profesion]/page.tsx`)
detecta automáticamente el estado y renderiza
`components/catalog/DirectRequestForm.tsx` en su lugar — un formulario de
solicitud de presupuesto sin ningún rango de precio, que crea un `lead` con
`estimateId = null` (ver `lib/catalog/actions.ts#submitDirectLeadAction`).
No hace falta ningún código nuevo para este paso.

Desde la plataforma real de leads (ver `docs/LEAD-LIFECYCLE.md`), ese
lead pasa automáticamente por validación y por el algoritmo de asignación
en cuanto se crea (`lib/leads/intake-service.ts#processNewLead`) — para
que de verdad se le asigne a alguien, tiene que existir ya al menos un
profesional verificado, activo, con cobertura de ese `serviceTypeId` y
región (`docs/PROFESSIONAL-ONBOARDING.md`). Sin eso, queda honestamente en
`sin_cobertura`, no es un error del servicio nuevo.

## Paso 2 — Construir la calculadora completa (`disponible`)

Esto exige trabajo de ingeniería real, pero desde que existe la
**calculadora genérica** (ver más abajo) casi nunca hace falta construir
un Wizard nuevo desde cero. Hay dos caminos:

- **Camino genérico (por defecto)** — el servicio tiene 1-3 factores de
  precio simples (selección + cantidad + algún extra condicional) y no
  necesita lógica de negocio propia (como el RITE del aire acondicionado).
  Añade una entrada a `CALCULATOR_CONFIGS`, siembra los factores, y ya
  está: reutiliza el motor, la validación, el wizard y la página de
  resultado sin escribir ningún componente nuevo. Ver la sección
  "Calculadora genérica" más abajo.
- **Camino a medida** — el servicio necesita una lógica de combinación
  distinta, campos muy específicos, o un cálculo auxiliar propio (como el
  RITE). Usa `aire-acondicionado/instalacion` como referencia end-to-end
  (`Wizard.tsx`, `calculatorFormSchema`, `calculateEstimateAction`
  propios). Este camino sigue existiendo y sigue siendo válido — la
  calculadora genérica no lo sustituye, lo complementa.

En ambos casos, los pasos de fondo son los mismos:

1. **Definir los campos del servicio**: qué preguntas necesita el usuario
   responder. Cada pregunta debe justificar su existencia — no añadas
   campos solo para que el formulario parezca más completo. Si un campo no
   controla ningún factor de precio real, no lo añadas (hay un test que lo
   comprueba para la calculadora genérica, ver más abajo).
2. **Reglas de precio** (`pricing_rules` + `pricing_factors`, gestionadas
   desde `/admin/reglas-precio`): cada factor cita una fuente
   (`data_sources`, `/admin/fuentes`) y una confianza (A/B/C). Nunca se
   inventa un rango sin fuente citada. Si no puedes justificar razonablemente
   una fórmula con fuentes reales, no publiques una calculadora: deja el
   servicio en `solo_solicitud` en su lugar.
3. **Motor de estimación**: si la lógica de combinar factores es simple
   (suma/multiplicación condicional), reutiliza
   `lib/estimation/engine.ts` tal cual — ya es genérico, no está acoplado
   al aire acondicionado. Si el servicio necesita una lógica de
   combinación distinta, créala en `lib/estimation/` siguiendo el mismo
   patrón (motor puro, sin Drizzle, testeable con fixtures).
4. **Validación**: para el camino genérico ya existe
   (`lib/estimation/generic/validation.ts`); para el camino a medida, un
   esquema Zod server-side propio, nunca solo validación de cliente.
5. **Formulario guiado**: camino genérico → añade la config a
   `CALCULATOR_CONFIGS` y usa `GenericWizard.tsx` tal cual. Camino a
   medida → reutiliza `components/calculator/Wizard.tsx` si los pasos
   encajan, o compón uno nuevo a partir de las piezas reutilizables de
   `components/ui/FormControls.tsx` (`RadioCardGroup`, `ToggleButtonGroup`,
   `NumberField`, `TextField`, `FieldLabel`) y
   `components/ui/StepIndicator.tsx` — no dupliques ese HTML a mano.
6. **Página de la calculadora**: camino genérico → ya existe
   (`app/[categoria]/[servicio]/page.tsx`, cerrada a las configs de
   `CALCULATOR_CONFIGS` vía `generateStaticParams`) — solo tienes que
   añadir el `serviceSlug`/`categorySlug` a la config. Camino a medida →
   crea la página en `/{categorySlug}/{serviceSlug}` igual que
   `/aire-acondicionado/instalacion`.
7. **Resultado**: reutiliza `components/result/RangeBar.tsx`,
   `components/result/Breakdown.tsx`, `components/result/ConfidenceTag.tsx`
   y `components/leads/LeadRequestCard.tsx` — son genéricos, no dependen
   de aire acondicionado. `app/resultado/[id]/page.tsx` ya distingue
   automáticamente aire acondicionado del resto vía
   `getServiceTypeWithCategoryById` — no hace falta tocarlo para un
   servicio nuevo.
8. **Metadatos SEO**: usa `lib/metadata.ts#pageMetadata` y añade la ruta a
   `app/sitemap.ts` si es una página estática nueva fuera del catálogo
   dinámico.
9. **Pruebas**: tests unitarios del motor/validación (ver
   `lib/estimation/*.test.ts` como referencia) + si usas el camino
   genérico, añade el caso a `lib/estimation/generic/calculator-configs.test.ts`
   (comprueba que cada campo de la config controla un factor sembrado) y a
   `lib/estimation/generic/actions.integration.test.ts` (calcula, persiste
   y comprueba el escenario de IVA esperado) + una pasada manual de los
   recorridos A-E (ver `docs/MVP-COMPLETION-AUDIT.md`).
10. **Activar**: solo cambia `availabilityStatus` a `disponible` cuando
    todo lo anterior esté probado. Hasta entonces, el servicio sigue
    honestamente en `proximamente` o `solo_solicitud`.

## Calculadora genérica (`lib/estimation/generic/`)

Desde la activación de los 17 servicios que estaban "Próximamente"
(ver `docs/09-investigacion-precios-multi-servicio.md`), existe un
segundo camino además del Wizard a medida de aire acondicionado:

- **`lib/estimation/generic/calculator-configs.ts`** — un array
  declarativo, una entrada por servicio, con los campos del formulario
  (`select` / `quantity` / `flag`). Las claves (`key`) de cada campo
  tienen que coincidir exactamente con `condition.field` /
  `perUnitOfQuantity` de los factores sembrados — si no coinciden, el
  factor no se aplica nunca, silenciosamente (el motor no lanza error por
  una clave desconocida). Por eso existe
  `calculator-configs.test.ts`: compara cada config contra los factores
  reales en Postgres y falla si algún campo del formulario no controla
  ningún precio.
- **`components/calculator/GenericWizard.tsx`** — un wizard de 2 pasos
  que renderiza cualquier config sin cambios de código.
- **`lib/estimation/generic/validation.ts`** / **`actions.ts`** —
  validación Zod y Server Action genéricas; reutilizan exactamente el
  mismo motor (`evaluateEstimate`) y la misma persistencia
  (`persistEstimate`) que aire acondicionado.
- **`app/[categoria]/[servicio]/page.tsx`** — la única página para las 11
  calculadoras genéricas, cerrada por `generateStaticParams` a las
  entradas de `CALCULATOR_CONFIGS` (nunca genera una página para un
  slug que no esté en la lista).

**Detalle importante de IVA**: `groupKey` es principalmente cosmético
(la etiqueta del ítem en el desglose), pero el cálculo de "% de
materiales" para decidir el IVA reducido (art. 91.Uno.2.10º) solo
reconoce los grupos `"equipo"` y `"paquete_conductos"` — cualquier factor
en otro grupo cuenta como 0% de materiales por defecto. Para un servicio
donde el producto/equipo domina el coste (como un termo eléctrico o un
armario a medida, igual que la unidad de aire acondicionado), el factor
`base` **debe** llevar `groupKey: "equipo"`, o el sistema aplicará
incorrectamente el 10% reducido a un servicio que en realidad supera el
40% de materiales. Este bug real se detectó y se corrigió durante la
activación de estos 11 servicios (ver el informe de esa fase) — de ahí
la aserción de regresión permanente en
`actions.integration.test.ts` que fija que "instalar-un-termo" e
"instalar-un-armario-a-medida" tributan siempre al tipo general.

**Cuándo NO usar el camino genérico**: si el servicio necesita un
cálculo auxiliar propio (como el RITE de aire acondicionado), más de 3
campos, o una lógica de combinación que no sea "suma condicional de
factores", usa el camino a medida en su lugar. No fuerces un servicio
complejo dentro del formato genérico solo por reutilizar código — "no
dupliques la aplicación para cada profesión" no significa "todo tiene
que caber en el mismo molde".

## Qué NO hacer

- No publiques un servicio en `disponible` sin fuentes citadas para cada
  factor de precio.
- No dupliques `Wizard.tsx` entero para un formulario casi idéntico:
  parametrízalo o extrae las piezas comunes a `FormControls.tsx`.
- No crees decenas de servicios "por si acaso" — cada uno sin uso real es
  contenido fino (thin content) que perjudica SEO y no ayuda a nadie.
- No cambies la URL de un servicio ya `disponible` sin valorar el impacto
  SEO (redirecciones, enlaces externos ya indexados).
