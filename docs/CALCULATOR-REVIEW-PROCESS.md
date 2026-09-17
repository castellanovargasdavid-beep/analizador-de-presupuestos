# Proceso de revisión de calculadoras

Este documento define **quién revisa qué, cuándo y cómo** — el proceso
humano que complementa lo que `lib/quality/confidence-gate.ts` puede
comprobar mecánicamente. Ver `docs/CALCULATOR-QUALITY-STANDARD.md` §7
para la lista de criterios que, por naturaleza, no se pueden verificar
con una consulta SQL.

## 1. Responsable

Mientras el equipo sea una sola persona (David), es también quien revisa.
Si en el futuro se incorpora alguien más al negocio, este documento debe
actualizarse para nombrar explícitamente quién tiene la responsabilidad
de cada tipo de revisión — nunca debe quedar implícito.

`pricing_rules.reviewedBy` registra quién hizo la última revisión formal,
en texto libre, para que quede trazado incluso con un equipo de una sola
persona.

## 2. Cuándo se revisa una regla de precio

### 2.1. Revisión inicial (obligatoria antes de `disponible`)

Ninguna regla de precio pasa a activarse sin al menos una revisión
formal completa (esto es lo que exige el criterio B6 de
`CALCULATOR-QUALITY-STANDARD.md` — nace en revisión, no se asume
correcta). La checklist de la revisión inicial:

- [ ] Cada factor de precio cita una fuente real y trazable.
- [ ] El alcance (`whatIncluded`/`whatExcluded`) refleja de verdad lo que
      la fórmula calcula, sin vaguedades.
- [ ] Las opciones del formulario cubren los casos más comunes del
      servicio — criterio humano, no mecanizable: ¿un profesional real de
      este oficio reconocería estas preguntas como las relevantes?
- [ ] No hay ninguna variable crítica obviamente ignorada (ver ejemplos en
      `CALCULATOR-QUALITY-STANDARD.md` §7).
- [ ] La cobertura geográfica declarada es honesta (si los datos son solo
      de una región, no se declara "España" sin más).
- [ ] El groupKey de cada factor es correcto a efectos de IVA (ver la
      nota sobre `"equipo"` en `docs/ADDING-NEW-SERVICE.md` — un error
      aquí ya ocurrió una vez de verdad en este proyecto).

### 2.2. Revisión periódica (cada 12 meses como máximo)

`pricing_rules.nextReviewDueAt` marca la fecha límite. Pasada esa fecha
sin una nueva revisión, `confidence-gate.ts` deja de considerar la regla
elegible para A (criterio A4) aunque la validación empírica siga siendo
buena — los precios de mercado cambian, y una fórmula "congelada" durante
años deja de ser fiable aunque en su día lo fuera.

En cada revisión periódica:

- [ ] ¿Siguen vigentes las fuentes citadas? (una fuente puede caducar sin
      que nadie la desactive explícitamente en `data_sources` — parte de
      la revisión es precisamente comprobarlo y desactivarla si toca).
- [ ] ¿Los precios de mercado se han movido lo suficiente como para
      revisar los rangos? (inflación, cambios normativos, nuevos
      productos).
- [ ] Revisar los "casos extremos" que `validation-metrics.ts` haya
      marcado desde la última revisión — ¿son imprevistos genuinos o
      señalan un problema real de la fórmula?
- [ ] Actualizar `knownIssues` con cualquier limitación nueva detectada.

### 2.3. Revisión disparada por evidencia (en cualquier momento)

No hay que esperar a la fecha programada si:

- Una muestra de validación nueva es un caso extremo (>50% de error).
- El sesgo medio empieza a acercarse al límite de ±15% aunque todavía no
  lo haya superado.
- Cambia la normativa que sustenta un factor (p. ej. una modificación del
  REBT que afecte a la fórmula del cuadro eléctrico).

## 3. Qué hacer cuando una regla deja de cumplir su nivel actual

Si una revisión (periódica o disparada) descubre que una regla ya no
cumple los criterios de su nivel actual (p. ej. una fuente ha caducado y
ahora `confidence-gate.ts` la sitúa en C en vez de B):

1. **No se oculta ni se retrasa la revisión** para "mantener" el nivel
   artificialmente — el sistema ya lo impide técnicamente (el nivel se
   calcula, no se declara), pero la disciplina humana es no intentar
   evitar que se recalcule.
2. Se documenta en `pricing_rules.knownIssues` qué cambió.
3. Se decide una acción: buscar una fuente de reemplazo, ajustar los
   rangos, o (si la fórmula ya no es defendible) plantear volver el
   servicio a `solo_solicitud` en vez de mantener una calculadora que ya
   no se sostiene.

## 4. Historial de cambios de este proceso

Cualquier cambio a los umbrales de `QUALITY_THRESHOLDS` en
`lib/quality/confidence-gate.ts`, o a este proceso, se registra aquí con
fecha y motivo — nunca se cambia un umbral en silencio dentro de un
commit de otra cosa.

| Fecha | Cambio | Motivo |
|---|---|---|
| 2026-09-17 | Creación del proceso y de los umbrales iniciales (20 muestras, 70% hit rate, ±15% sesgo, revisión cada 12 meses) | Primera definición operativa de confianza A, a petición explícita de David — ver `docs/CALCULATOR-QUALITY-STANDARD.md` |

## 5. Próxima revisión programada

Ninguna regla de precio de este catálogo tiene todavía una
`nextReviewDueAt` porque ninguna ha pasado por su revisión inicial formal
con este proceso (las 11 calculadoras activadas en la fase anterior se
sembraron con `lastReviewedAt`/`nextReviewDueAt` vacíos — ver
`docs/PRICE-METHODOLOGY-INDEX.md` para el estado exacto de cada una).
Completar la revisión inicial de las 11 reglas activas es, por tanto, la
primera acción pendiente de este proceso, no una tarea futura abstracta.
