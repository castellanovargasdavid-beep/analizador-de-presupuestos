# Protocolo de validación de precios contra presupuestos reales

Este documento define **cómo** se recogen, registran y usan presupuestos
reales para medir el error de una calculadora — el mecanismo que decide si
un servicio puede alcanzar confianza A según
`docs/CALCULATOR-QUALITY-STANDARD.md`.

## 1. De dónde deben salir las muestras (nunca inventadas)

Solo hay dos orígenes legítimos, ambos modelados en
`price_validation_samples.source`:

### 1.1. `lead_cerrado` — la vía principal y sostenible

Cuando un profesional real cierra un trabajo a través de la plataforma y
un administrador registra el precio acordado (`leads.agreedPrice`) o el
pago (`leads.paymentAmount`) en `/admin/leads/[id]`, ese dato **es** un
presupuesto real. Es la vía preferida porque:

- No requiere ningún trabajo adicional de recogida de datos — es un
  subproducto natural de operar la plataforma.
- Está automáticamente vinculado al `serviceTypeId`, la región, y (si el
  lead venía de una calculadora) a la `Estimate` original — permite
  calcular el error exacto sin ambigüedad.
- Crece solo con el volumen de negocio real, que es la señal de calidad
  que de verdad importa.

**Procedimiento**: cuando un lead pasa a `pagado` o se registra
`agreedPrice`, un administrador crea manualmente la fila correspondiente
en `price_validation_samples` desde `/admin/reglas-precio/[ruleId]`
(sección "Registrar un presupuesto real"), indicando el id del lead y,
si existe, el id de la `Estimate` asociada. **No se automatiza esta
creación** (no hay un trigger que copie `agreedPrice` directamente):
un administrador debe confirmar explícitamente los campos que la tabla
`leads` no captura con la fiabilidad necesaria para una muestra de
validación (si el precio incluye IVA, si incluye materiales, si hubo
imprevistos) — automatizarlo sin esa confirmación arriesgaría contar
como "presupuesto limpio" un caso con matices que invalidarían la
comparación.

### 1.2. `aportado_manualmente` — vía complementaria, mientras no hay volumen

Antes de tener leads reales cerrados (la situación de hoy: 0 leads
cerrados en toda la plataforma), la única forma honesta de empezar a
acumular evidencia es que alguien con acceso a presupuestos reales
recientes de un profesional colaborador los aporte directamente:

- Un presupuesto real que David (o un profesional de su red) haya emitido
  o recibido recientemente para uno de los 18 servicios, con el detalle
  suficiente para rellenar los campos de la tabla.
- Debe ser un caso real y reciente, no un ejemplo típico "de memoria" —
  la diferencia entre ambos es exactamente lo que este protocolo existe
  para proteger.

## 2. Qué se registra por cada muestra (`price_validation_samples`)

| Campo | Por qué es necesario |
|---|---|
| `serviceTypeId` | Sin esto no se puede asociar la muestra a una calculadora concreta |
| `regionId` (opcional) | Permite en el futuro detectar si el error varía por zona |
| `source` | Distingue evidencia de negocio real de aportación manual — nunca se ocultan por igual, ver `docs/CALCULATOR-REVIEW-PROCESS.md` |
| `relatedLeadId` (opcional) | Trazabilidad hasta el lead real, para poder auditar el dato si hace falta |
| `relatedEstimateId` (opcional) | Imprescindible para calcular el error — sin esto la muestra solo sirve como referencia de precio real, no como validación de la fórmula (ver `docs/CALCULATOR-QUALITY-STANDARD.md`, "muestras comparables") |
| `finalPriceWithVat` | El dato central: cuánto costó de verdad |
| `includesVat`, `includesMaterials`, `requiredVisit`, `hadUnexpectedIssues` | Contexto que puede explicar un error grande sin invalidar la fórmula (p. ej. un imprevisto real no es un fallo de la calculadora) |
| `projectCharacteristics` | Texto libre para poder interpretar casos extremos más adelante, sin capturar ningún dato personal del cliente |
| `quoteDate` | Permite excluir muestras muy antiguas si los precios de mercado han cambiado sustancialmente |

## 3. Cómo se calculan las métricas (`lib/quality/validation-metrics.ts`)

Para cada muestra con una `Estimate` asociada:

- **Punto medio estimado** = `(totalMin + totalMax) / 2`.
- **Error absoluto** = `|puntoMedioEstimado − precioReal|`.
- **Error porcentual** = `errorAbsoluto / precioReal`.
- **Acierto (hit)** = el precio real cae dentro de `[totalMin, totalMax]`.
- **Sesgo** = `(puntoMedioEstimado − precioReal) / precioReal`, promediado
  con signo — positivo indica que el sistema tiende a sobrevalorar,
  negativo que tiende a infravalorar.

Agregado sobre todas las muestras comparables de un servicio:

- **MAE** (error absoluto medio, en €).
- **MAPE** (error porcentual medio).
- **Mediana del error porcentual** (menos sensible a casos extremos que
  la media).
- **Hit rate** (% de aciertos).
- **Sesgo medio**.
- **Casos extremos**: cualquier muestra con error porcentual > 50% se
  marca explícitamente para revisión manual — puede ser un fallo real de
  la fórmula o un caso atípico (imprevisto grande, dato mal registrado)
  que merece anotarse en `pricing_rules.knownIssues` en vez de ignorarse.

Las muestras **sin** `Estimate` asociada (típicamente, un lead de un
servicio `solo_solicitud`) se cuentan aparte (`totalSampleSize` vs.
`comparableSampleSize`): siguen siendo útiles como catálogo de precios
reales de mercado — por ejemplo, para decidir en el futuro si un servicio
`solo_solicitud` tiene ya suficiente consistencia de precios como para
intentar una calculadora — pero no entran en el cálculo de error porque
no hay ningún rango con el que compararlas.

## 4. Umbrales para confianza A

Ver `docs/CALCULATOR-QUALITY-STANDARD.md` §3 y §5 para la justificación
completa. Resumen:

- Mínimo 20 muestras comparables.
- Al menos 70% de aciertos dentro de rango.
- Sesgo medio dentro de ±15%.
- Revisión de la metodología vigente (menos de 12 meses).

## 5. Qué NO es una muestra de validación válida

- Un precio estimado por otra calculadora o agregador (no es un
  presupuesto real cerrado, es más de lo mismo que ya alimenta la
  fórmula).
- Un precio "típico" que alguien recuerda sin poder precisar el proyecto
  concreto.
- Cualquier caso donde no se pueda confirmar razonablemente que el
  trabajo se ejecutó y se cobró tal como se registra.
- Un dato duplicado de la misma muestra contado dos veces para inflar el
  tamaño de muestra.

## 6. Estado actual (a fecha de creación de este documento)

`price_validation_samples` está vacía para los 18 servicios de este
catálogo. Cero servicios tienen validación empírica. Esto es coherente
con que la plataforma todavía no tiene profesionales reales dados de alta
(ver `docs/PROFESSIONAL-ONBOARDING.md`) ni, por tanto, ningún lead
cerrado. El camino concreto para empezar a llenar esta tabla es:

1. Onboarding de al menos un profesional real por servicio piloto (ver
   recomendación de "servicio piloto" en el informe de esta misión).
2. Que ese profesional cierre trabajos reales a través de la plataforma.
3. Que un administrador registre cada precio acordado como muestra de
   validación, siguiendo el procedimiento del §1.1.
4. Repetir hasta alcanzar los umbrales del §4 — con el volumen de un
   negocio en fase inicial, esto es una cuestión de meses, no de días, y
   debe comunicarse así internamente para no generar la tentación de
   saltarse el umbral.
