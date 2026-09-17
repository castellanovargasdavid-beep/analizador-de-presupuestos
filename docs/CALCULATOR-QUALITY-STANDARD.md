# Estándar de calidad de las calculadoras — qué significa "confianza A"

Este documento es la fuente única de verdad sobre qué significa cada nivel
de confianza en Presupuesto Claro. No es una guía de estilo ni un
argumento comercial: es un **contrato verificable**. Un nivel de confianza
que no se pueda comprobar consultando datos reales (factores sembrados,
fuentes citadas, muestras de validación en base de datos) no es válido,
por muy bien que "quede" en la página de resultado.

**Regla de origen** (la razón de ser de este documento, tal cual la dio
David, propietario del producto): *"Mi objetivo comercial es que las
calculadoras alcancen confianza A, no que se publiquen rangos aproximados
basados únicamente en agregadores... No quiero que etiquetes una
calculadora como 'A' si los datos o la metodología no lo justifican."*

## 0. Dos ejes de confianza que NO deben confundirse

El motor de estimación (`lib/estimation/`) ya tenía, antes de este
documento, un concepto de "confianza" a nivel de **factor de precio**
(A/B/C en `pricing_factors.confidence`) que sirve para **ensanchar el
rango de incertidumbre** (`lib/estimation/uncertainty.ts`): un factor C
hace que el rango final sea más ancho que uno A. Ese mecanismo sigue
existiendo tal cual y **no lo sustituye este documento** — sigue siendo
correcto y necesario para dimensionar la horquilla de cada estimación
individual.

Lo que este documento define es un **segundo eje, a nivel de regla de
precio / servicio completo**: la **clasificación de confianza que se
muestra al usuario como etiqueta del servicio** ("Nivel de confianza: A").
Esta clasificación:

- **Se calcula, nunca se declara.** No existe ningún campo en el panel de
  administración donde un humano pueda escribir "A" a mano. Se deriva
  siempre de datos reales en la base de datos mediante
  `lib/quality/confidence-gate.ts#computeJustifiableConfidence`. Si los
  datos no cumplen los criterios, el sistema **no permite** que la
  calculadora se etiquete como A, técnicamente, no solo por convención.
- Es **por regla de precio** (`pricing_rules`), no por servicio en
  abstracto: cuando se crea una v2 de la fórmula de un servicio, su
  clasificación de confianza se recalcula desde cero con los datos de esa
  versión — un cambio de metodología no hereda automáticamente la
  confianza de la anterior.

## 1. Confianza C — "orientativo, dato escaso o indirecto"

Es el nivel por defecto. Un servicio empieza aquí y sube solo si demuestra
que cumple más.

**Se aplica cuando falta cualquiera de los requisitos de B.** No hace
falta ningún requisito positivo adicional: es el suelo.

**Qué debe transmitir al usuario**: esto es una referencia informativa,
no una estimación con metodología verificada. Útil para hacerse una idea
muy general, no para negociar con un profesional con confianza.

## 2. Confianza B — "metodología razonable, sin validación empírica suficiente"

Requisitos **todos obligatorios** para que una regla de precio pueda
clasificarse como B (verificados automáticamente por `confidence-gate.ts`
contra la base de datos, no por criterio del administrador):

| # | Criterio | Cómo se verifica |
|---|---|---|
| B1 | Existe un documento de metodología específico para el servicio (`docs/metodologia/<slug>.md`), enlazado desde `pricing_rules.methodologyDocPath` | Campo no nulo en `pricing_rules` |
| B2 | El alcance está definido: qué incluye y qué excluye el cálculo | `service_types.whatIncluded` y `whatExcluded` no vacíos |
| B3 | La cobertura geográfica está declarada explícitamente (aunque sea "toda España sin diferenciación autonómica") | `pricing_rules.geographicScope` no nulo |
| B4 | Ningún factor activo de la regla se apoya **únicamente** en una heurística propia sin ningún dato externo (`data_sources.sourceType = 'heuristica_propia'` como única fuente de todos los factores `kind = 'base'`) | Al menos un factor `base` cita una fuente `oficial`, `catalogo_real` o `mercado` |
| B5 | Cada factor tiene una fuente citada (`pricing_factors.sourceId` no nulo) con fecha de consulta conocida (`data_sources.retrievedOn`) | Consulta directa a la tabla |
| B6 | La regla ha pasado al menos una revisión formal (`pricing_rules.lastReviewedAt` no nulo) — nace en revisión, no se asume correcta por defecto | Campo no nulo |
| B7 | Ningún dato de la fórmula usa una fuente caducada (`data_sources.isActive = false`) | Consulta directa |

**Qué transmite al usuario**: la fórmula tiene una lógica documentada y
fuentes razonables, pero **todavía no se ha comprobado contra resultados
reales**. El margen de incertidumbre es deliberadamente amplio. Es la
etiqueta honesta para casi todos los servicios de este catálogo hoy.

## 3. Confianza A — "metodología documentada Y validada empíricamente"

Todos los requisitos de B, **más todos estos**, también verificados
automáticamente y nunca por declaración manual:

| # | Criterio | Cómo se verifica | Umbral por defecto |
|---|---|---|---|
| A1 | Existe una muestra suficiente de presupuestos reales anonimizados (`price_validation_samples`) asociados a este `serviceTypeId` | `COUNT(*)` en la tabla | `MIN_SAMPLE_SIZE_FOR_A = 20` (ver §5) |
| A2 | El porcentaje de casos donde el precio real cae dentro del rango estimado es suficientemente alto | `hitRatePct` calculado por `lib/quality/validation-metrics.ts` | `MIN_HIT_RATE_FOR_A = 70%` |
| A3 | No hay sesgo sistemático relevante (la fórmula no infravalora ni sobrevalora de forma consistente) | `abs(biasPct)` calculado | `MAX_BIAS_FOR_A = 15%` |
| A4 | La revisión de la metodología está vigente, no caducada | `pricing_rules.lastReviewedAt` dentro de `REVIEW_INTERVAL_MONTHS_FOR_A` | `12 meses` |
| A5 | Las limitaciones conocidas están documentadas explícitamente, aunque existan | `pricing_rules.knownIssues` — puede tener contenido, lo que no puede pasar es que existan limitaciones reales sin documentar (esto se revisa a mano en el proceso de `CALCULATOR-REVIEW-PROCESS.md`, no es mecánicamente verificable) | — |

**Nota importante sobre fuentes y confianza A**: A **no exige** que cada
euro de la fórmula venga de una norma oficial. Exige que, se hayan usado
las fuentes que se hayan usado, **el resultado final se haya demostrado
preciso contra la realidad**. Una fórmula construida inicialmente con
datos de agregadores (confianza B) puede llegar a A si, tras un número
suficiente de trabajos reales cerrados en la plataforma, se demuestra
empíricamente que acierta. Esto es intencional: es la única vía realista
para una empresa que no tiene acceso a bases de precios de pago (ver
§6) ni a presupuestos reales el día 1. La calibración empírica es
evidencia tan válida como una fuente oficial — más, de hecho, porque mide
el resultado final, no un insumo intermedio.

**Qué transmite al usuario**: este rango se ha contrastado contra
trabajos reales y ha demostrado ser preciso. Sigue sin ser un presupuesto
cerrado (nunca lo es, en ningún nivel), pero es la referencia más fiable
que ofrece el sistema.

## 4. Lo que NUNCA debe pasar

- Nunca se muestra "Confianza A" en una página pública si
  `computeJustifiableConfidence()` no devuelve `'A'` en ese momento para
  esa `pricing_rules.id` exacta.
- Nunca se recalcula la confianza "a mano" para subir un servicio de nivel
  por presión comercial. El único camino para subir de nivel es que los
  datos subyacentes cambien de verdad (más muestras, mejor sesgo, revisión
  al día).
- Nunca se cuenta una muestra de validación inventada o estimada para
  alcanzar el umbral — cada fila de `price_validation_samples` debe
  corresponder a un presupuesto real (ver `docs/PRICE-VALIDATION-PROTOCOL.md`
  para de dónde deben salir).
- Nunca se baja el umbral (`MIN_SAMPLE_SIZE_FOR_A`, etc.) para que un
  servicio concreto alcance A más rápido. Si el umbral se revisa, se hace
  de forma general y documentada (ver §5), nunca ad-hoc para un servicio.

## 5. Umbrales — de dónde salen y cómo se revisan

Los umbrales (`MIN_SAMPLE_SIZE_FOR_A = 20`, `MIN_HIT_RATE_FOR_A = 70%`,
`MAX_BIAS_FOR_A = 15%`, `REVIEW_INTERVAL_MONTHS_FOR_A = 12`) son una
propuesta inicial razonable, no una verdad estadística absoluta:

- **20 muestras** es un tamaño mínimo habitual para que un error medio o
  una mediana empiecen a ser mínimamente estables, sin exigir un volumen
  que ningún negocio en fase de lanzamiento puede alcanzar en un plazo
  razonable. No es "significación estadística" en sentido riguroso (para
  eso harían falta muestras mayores y un diseño experimental que esta
  plataforma no tiene sentido que persiga); es un umbral operativo
  explícito y ajustable.
- **70% de acierto dentro de rango** dejaría fuera de rango 3 de cada 10
  casos reales, lo cual es exigente pero no perfeccionista — un rango que
  falla la mitad de las veces no puede llamarse "validado".
- **15% de sesgo máximo** evita que una fórmula sistemáticamente barata o
  cara pase el filtro solo porque el rango es tan ancho que "casi
  siempre" contiene el precio real.

Estos números viven como constantes documentadas en
`lib/quality/confidence-gate.ts` (nunca hardcodeadas sin comentario ni
repetidas en varios sitios). Cambiarlos es una decisión de producto que
debe registrarse en el historial de `docs/CALCULATOR-REVIEW-PROCESS.md`,
no un ajuste silencioso en un commit de features.

## 6. Sobre las fuentes de pago (CYPE, ITEC/BEDEC y similares)

Existen bases de precios de la construcción reconocidas en España (CYPE
Generador de Precios, ITEC BEDEC en Cataluña, IVE en la Comunitat
Valenciana, bases de colegios de aparejadores) que son citadas
habitualmente como referencia técnica de calidad. La mayoría requieren
licencia de pago para consultar el detalle de precios; algunas
comunidades autónomas publican partes de sus bases de forma gratuita.
Este proyecto:

- Nunca cita como fuente un precio que no ha podido verificar
  gratuitamente. Si una base de precios es de pago y no se ha contratado,
  se documenta su existencia en `docs/PRICE-SOURCES-REGISTER.md` como
  "fuente conocida, no accesible actualmente" — nunca se inventa el
  precio que probablemente contendría.
- Si el negocio decide en el futuro contratar el acceso a alguna de estas
  bases, eso mejora la clasificación de fuente de los factores afectados
  (de `mercado` a `catalogo_real` u `oficial` según corresponda), pero
  **sigue sin ser suficiente por sí solo para alcanzar confianza A** sin
  la validación empírica de §3 — una fuente mejor reduce el riesgo de
  error, no lo demuestra.

## 7. Criterios explícitamente NO mecanizables (revisión humana)

Algunos de los criterios que pedía la misión original no se pueden
verificar con una consulta SQL, y sería deshonesto fingir que sí. Se
gestionan en el proceso de revisión humana
(`docs/CALCULATOR-REVIEW-PROCESS.md`), no en `confidence-gate.ts`:

- **Ausencia de variables críticas ignoradas**: requiere criterio experto
  sobre el dominio (¿nos falta preguntar algo que cambia mucho el precio?
  Ej. si "reparar una fuga" no pregunta si hay que picar pared, eso es una
  variable crítica ignorada). Se revisa como checklist manual en cada
  revisión periódica.
- **Perfil de trabajo estándar razonable**: que las opciones del
  formulario reflejen de verdad los casos más comunes, no una selección
  arbitraria.
- **Calidad real de la fuente más allá de su tipo**: que un `oficial` sea
  realmente aplicable (vigente, no derogado) es responsabilidad de quien
  revisa, `sourceType = 'oficial'` en la tabla no lo garantiza por sí
  solo si nadie comprobó la vigencia.

## 8. Resumen operativo (para quien solo lee esta sección)

```
C → nivel por defecto, sin requisitos.
B → metodología documentada + alcance definido + cobertura geográfica
    + al menos una fuente no puramente heurística + revisión formal hecha.
A → todo lo de B, MÁS validación empírica real:
    ≥20 presupuestos reales, ≥70% dentro de rango, sesgo ≤15%,
    revisión vigente (<12 meses).
```

Ningún servicio de este catálogo tiene, a fecha de creación de este
documento, ninguna muestra de validación empírica (`price_validation_samples`
está vacía) — por tanto **ningún servicio puede alcanzar A todavía**, sin
excepción, independientemente de la calidad de sus fuentes. Esto es
intencional y se documenta con detalle, servicio por servicio, en
`docs/PRICE-METHODOLOGY-INDEX.md`.
