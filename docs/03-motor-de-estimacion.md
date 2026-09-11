# Motor de estimación — arquitectura de datos y cálculo

Sustituye el módulo `lib/pricing/*` de la fase de UX (que ya avisaba de ser
un placeholder). Los precios ya no viven como constantes de TypeScript:
viven en Postgres, se editan sin desplegar código, y el cálculo es una
función pura y testeada que los combina.

## Por qué esta arquitectura

- **Ningún precio hardcodeado en componentes React ni en constantes de
  código de producto.** Todo vive en `pricing_factors`, `vat_rates` y
  `uncertainty_bands` (Postgres). El único código de negocio que SÍ vive en
  TypeScript es lo que es una *norma legal*, no un precio de mercado: el
  test de elegibilidad del IVA reducido (`lib/estimation/vat.ts`) y el
  umbral RITE (`lib/estimation/rite.ts`).
- **El motor (`lib/estimation/engine.ts`) no importa Drizzle ni sabe que
  existe una base de datos.** Recibe factores como datos planos y devuelve
  un resultado explicable. Esto es lo que permite testearlo exhaustivamente
  con fixtures, sin levantar Postgres.
- **Una fuente única de verdad para los datos sembrados**
  (`lib/estimation/seed-data.ts`): `db/seed.ts` inserta exactamente eso en
  Postgres, y los tests del motor consumen exactamente lo mismo como
  fixture. No pueden divergir en silencio.

## Modelo de datos (Postgres, `db/schema.ts`)

```
service_categories -> service_types -> pricing_rules -> pricing_factors
                                                       -> vat_rates
regions -> provinces -> cities            (jerarquía completa; solo se
                                            siembra lo que tiene evidencia:
                                            19 CCAA con multiplicador real
                                            solo en Madrid y Cataluña)
material_levels                           (económica/media/premium, genérico
                                            entre verticales)
data_sources                              (cada factor y cada tarifa de IVA
                                            cita una fila de aquí)
uncertainty_bands                         (cuánto se ensancha el rango según
                                            la confianza agregada)

estimates -> estimate_items               (una fila persistida, calculada
          -> estimate_ranges               UNA vez; nunca se recalcula al
                                            leer, así que un enlace
                                            compartido no cambia por debajo
                                            de los pies de quien lo recibió)
user_budgets -> user_budget_items          (presupuesto declarado + veredicto
                                            por partida)
```

`pricing_rules.version` + `valid_from`/`valid_to` dan el versionado: una
`Estimate` referencia el id exacto de la regla con la que se calculó. Si
mañana cambian los factores (nueva versión, `is_active` distinto), las
estimaciones ya guardadas no se ven afectadas.

`pricing_factors.condition` es un mini-lenguaje cerrado (`eq`/`in`/`gt`/
`gte`/`lt`/`lte`/`truthy`/`all`/`any`, ver `lib/estimation/condition-types.ts`)
en vez de un DSL arbitrario: se puede validar, testear y editar desde SQL
sin poder inyectar lógica no controlada.

## Orden de cálculo (`evaluateEstimate`)

1. **Factores base** (equipo, mano de obra, paquete de conductos) — se
   agrupan por `group_key` y se suman dentro de cada grupo.
2. **Factores aditivos** — extras condicionales, planos o por unidad
   (`per_unit_of_quantity` referencia una clave de `quantities` del input;
   si la cantidad es 0, la partida ni se factura ni se muestra).
3. Suma de todos los grupos presentes → subtotal antes de ubicación.
4. **Multiplicadores** (ajuste por zona) sobre ese subtotal. Se muestran en
   el desglose como impacto en euros, no como el ratio en bruto (un "×1.08"
   crudo formateado como moneda sería ilegible).
5. **Incertidumbre**: se calcula un *score* de confianza (media ponderada
   por la magnitud en euros de cada contribución; pesos A=1, B=0.6, C=0.25,
   ver `lib/estimation/uncertainty.ts`) y se busca la banda
   (`uncertainty_bands`) que ensancha el rango en consecuencia. Más C, rango
   más ancho — a propósito: preferimos un rango honesto a uno estrecho con
   falsa precisión.
6. **IVA**: test legal en código (`lib/estimation/vat.ts`), tarifas como
   dato (`vat_rates`). 10% solo si persona física + vivienda >2 años +
   equipo ≤40% del subtotal; si no, 21%. En instalaciones de A/C el equipo
   casi siempre supera ese 40%, así que el resultado más habitual es 21% —
   el motor lo explica, no lo oculta.

Ningún resultado puede ser negativo: cada paso se recorta a 0
(`clampNonNegative`).

## Reproducibilidad vs. texto explicativo

Los NÚMEROS de una `Estimate` se congelan al guardarse (no se recalculan al
leer). El TEXTO explicativo (posibles razones, preguntas recomendadas) se
deriva en el momento de renderizar a partir de datos ya persistidos
(veredicto, rangos por grupo, potencia guardada en `inputs`) — así puede
mejorar su redacción con el tiempo sin necesidad de re-guardar cada
estimación histórica. Es una distinción deliberada: los precios no cambian
nunca retroactivamente; el copy sí puede.

## Panel de administración (arquitectura, no construido todavía)

Preparado para un futuro CRUD sin rediseño:

- **Modificar rangos / activar-desactivar reglas y factores**: `is_active`
  en `pricing_rules` y `pricing_factors` permite desactivar sin borrar
  historial. Una nueva versión de regla convive con la anterior hasta que
  se desactiva.
- **Cambiar factores**: editar filas de `pricing_factors` directamente
  (o, cuando exista panel, un formulario CRUD sobre esa tabla).
- **Actualizar fuentes**: `data_sources` es la tabla única a mantener;
  cualquier factor/tarifa que la cite se beneficia sin tocar código.
- **Revisar anomalías**: no existe una tabla dedicada todavía — el propio
  `user_budgets.deviation_pct` es la superficie de consulta (ordenar por
  desviación absoluta/porcentual para encontrar casos extremos). Se decide
  no construir una tabla de anomalías separada mientras no haya un consumidor
  real de esa función, para no añadir infraestructura especulativa.

## Tests (`lib/estimation/*.test.ts`, `npm test`)

66 tests. Cobertura explícita de lo pedido:

- Mínimos/máximos: el rango nunca se invierte (min ≤ max) en ninguna
  combinación de tipo de sistema × gama.
- Casos normales y extremos: desde "sin extras" hasta acumular todos los
  extras simultáneamente — el resultado nunca es negativo.
- Regiones distintas: Madrid/Cataluña vs. resto de España vs. sin región.
  (No hay "provincias distintas" porque no existe evidencia a ese nivel de
  granularidad — ver docs/01; probarlo sería testear una precisión que el
  propio producto se niega a fabricar.)
- Combinaciones inválidas: un `systemType` que no existe lanza
  `InvalidEstimationInputError` en vez de devolver un número sin sentido.
- Ausencia de datos: sin factores, sin bandas de incertidumbre o sin
  tarifa de IVA general, el motor lanza `MissingPricingDataError` en vez de
  fallar en silencio o inventar un valor.
- Validación de input de usuario: `lib/estimation/validation.test.ts`
  cubre valores negativos, fuera de rango y enums inválidos con Zod.
- Un test de integración (`repository.integration.test.ts`) ejercita la
  capa real de Postgres — se salta automáticamente si no hay
  `DATABASE_URL`, para no romper `npm test` en un entorno sin base de datos.

## Cómo levantar el entorno de desarrollo

```
cp .env.example .env.local   # ajustar DATABASE_URL si no es local
npm run db:generate          # (solo si se cambia db/schema.ts)
npm run db:migrate
npm run db:seed
npm run dev
```
