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

## Paso 2 — Construir la calculadora completa (`disponible`)

Esto es lo que exige trabajo de ingeniería real. Usa
`aire-acondicionado/instalacion` como referencia end-to-end. Pasos:

1. **Definir los campos del servicio**: qué preguntas necesita el usuario
   responder. Cada pregunta debe justificar su existencia — no añadas
   campos solo para que el formulario parezca más completo.
2. **Reglas de precio** (`pricing_rules` + `pricing_factors`, gestionadas
   desde `/admin/reglas-precio`): cada factor cita una fuente
   (`data_sources`, `/admin/fuentes`) y una confianza (A/B/C). Nunca se
   inventa un rango sin fuente citada.
3. **Motor de estimación**: si la lógica de combinar factores es simple
   (suma/multiplicación condicional), reutiliza
   `lib/estimation/engine.ts` tal cual — ya es genérico, no está acoplado
   al aire acondicionado. Si el servicio necesita una lógica de
   combinación distinta, créala en `lib/estimation/` siguiendo el mismo
   patrón (motor puro, sin Drizzle, testeable con fixtures).
4. **Validación** (`lib/estimation/validation.ts` o un fichero nuevo si
   los campos son muy distintos): esquema Zod server-side, nunca solo
   validación de cliente.
5. **Formulario guiado**: reutiliza `components/calculator/Wizard.tsx` si
   los pasos encajan, o compón uno nuevo a partir de las piezas
   reutilizables de `components/ui/FormControls.tsx`
   (`RadioCardGroup`, `ToggleButtonGroup`, `NumberField`, `TextField`,
   `FieldLabel`) y `components/ui/StepIndicator.tsx` — no dupliques ese
   HTML a mano.
6. **Página de la calculadora**: debe vivir en `/{categorySlug}/{serviceSlug}`
   (convención ya usada por `/aire-acondicionado/instalacion`) para que
   `app/profesiones/[profesion]/page.tsx` pueda enlazarla automáticamente
   cuando el servicio esté en `disponible`.
7. **Resultado**: reutiliza `components/result/RangeBar.tsx`,
   `components/result/Breakdown.tsx`, `components/result/ConfidenceTag.tsx`
   y `components/leads/LeadRequestCard.tsx` — son genéricos, no dependen
   de aire acondicionado.
8. **Metadatos SEO**: usa `lib/metadata.ts#pageMetadata` y añade la ruta a
   `app/sitemap.ts` si es una página estática nueva fuera del catálogo
   dinámico.
9. **Pruebas**: tests unitarios del motor/validación (ver
   `lib/estimation/*.test.ts` como referencia) + una pasada manual de los
   recorridos A-E (ver `docs/MVP-COMPLETION-AUDIT.md`).
10. **Activar**: solo cambia `availabilityStatus` a `disponible` cuando
    todo lo anterior esté probado. Hasta entonces, el servicio sigue
    honestamente en `proximamente` o `solo_solicitud`.

## Ejemplo real (todavía no implementado, solo como referencia)

Si en el futuro se decide construir la calculadora de **"Pintar una
habitación"**: los campos naturales serían m² de la habitación, número de
paredes, si hay que emplastecer, calidad de la pintura. La regla de precio
necesitaría fuentes reales de precio por m² de pintura en España (con
confianza B o C, ya que no hay normativa como con el IVA del A/C). El
motor sería una simple regla `base + m² × factor`, reutilizando
`lib/estimation/engine.ts` sin cambios. El formulario reutilizaría
`Wizard.tsx` casi tal cual, cambiando solo las preguntas del paso 1 y 2.
Nada de esto está construido todavía — `pintar-una-habitacion` sigue en
`proximamente` a propósito, hasta que haya fuentes de precio verificadas.

## Qué NO hacer

- No publiques un servicio en `disponible` sin fuentes citadas para cada
  factor de precio.
- No dupliques `Wizard.tsx` entero para un formulario casi idéntico:
  parametrízalo o extrae las piezas comunes a `FormControls.tsx`.
- No crees decenas de servicios "por si acaso" — cada uno sin uso real es
  contenido fino (thin content) que perjudica SEO y no ayuda a nadie.
- No cambies la URL de un servicio ya `disponible` sin valorar el impacto
  SEO (redirecciones, enlaces externos ya indexados).
