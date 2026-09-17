# Índice y tabla de control de metodologías de precio

Tabla de control maestra de los 18 servicios que estaban "Próximamente"
en el catálogo original, con su estado real de investigación, calidad de
datos y confianza justificable — calculada, no declarada (ver
`docs/CALCULATOR-QUALITY-STANDARD.md`). Se actualiza cada vez que cambia
el estado real de un servicio (no es un documento que se escribe una vez
y se olvida).

**Resultado global de esta fase**: cero servicios en confianza A. Todos
los que tienen calculadora están en B, comprobado mecánicamente, no
supuesto. La razón es la misma en los 11 casos: `price_validation_samples`
está vacía (ver `docs/PRICE-VALIDATION-PROTOCOL.md`). Ninguna cantidad de
buena investigación de fuentes puede saltarse ese requisito, y no se ha
intentado.

## Tabla de control

| Servicio | Estado | Fuentes primarias encontradas | Calidad de los datos | Fórmula definida | Validación disponible | Error medido | Confianza justificable | Bloqueos pendientes | Próxima acción |
|---|---|---|---|---|---|---|---|---|---|
| Cambiar un grifo | `disponible` | Habitissimo (B, sembrada); Roca y CYPE (nuevas, no verificadas) | Razonable — mercado + indicio de fabricante | Sí, `docs/metodologia/cambiar-un-grifo.md` | 0 muestras | — | **B** | Ninguna muestra real | Onboarding de fontanero para servicio piloto |
| Cambiar una cerradura | `disponible` | Cronoshare (B, sembrada); CVL/TESA (nuevas, débiles) | La más débil de los 11 activos en fuente de fabricante | Sí, `docs/metodologia/cambiar-una-cerradura.md` | 0 muestras | — | **B** | Ninguna muestra real; sin fuente de fabricante mejor | — |
| Pintar una habitación | `disponible` | Cronoshare (B, sembrada); Titan/Bruguer/CYPE (nuevas, no verificadas) | Razonable — rendimiento de pintura documentado | Sí, `docs/metodologia/pintar-una-habitacion.md` | 0 muestras | — | **B** | Ninguna muestra real | — |
| Pintar una vivienda completa | `disponible` | Habitissimo (B, sembrada); mismas nuevas que habitación | Igual que "pintar una habitación", a escala | Sí, `docs/metodologia/pintar-una-vivienda.md` | 0 muestras | — | **B** | Ninguna muestra real | — |
| Añadir enchufes | `disponible` | Habitissimo (B, sembrada); CYPE mecanismo+cable (nuevas) | Segundo mejor respaldado de los 11 | Sí, `docs/metodologia/anadir-enchufes.md` | 0 muestras | — | **B** | Ninguna muestra real; factor "cableado nuevo" sigue en C | Sustituir factor C por CYPE, tras verificar |
| Instalar puntos de luz | `disponible` | Cronoshare (B, sembrada); CYPE parcial (nuevo, incompleto) | El más incompleto de los 11 en fuente propia | Sí, `docs/metodologia/instalar-puntos-de-luz.md` | 0 muestras | — | **B** | Ninguna muestra real | Reconstruir "punto completo" sumando partidas |
| Instalar un termo eléctrico | `disponible` | Habitissimo (B, sembrada); Cointra/Junkers/Fleck (nuevas, desactualizadas) | El mejor candidato a fuente de fabricante confirmada | Sí, `docs/metodologia/instalar-un-termo.md` | 0 muestras | — | **B** | Ninguna muestra real; tarifas de fabricante sin confirmar vigencia | Confirmar tarifa 2026 de un fabricante |
| Reparar una fuga | `disponible` | Habitissimo (B, sembrada); ninguna nueva mejor que agregador | El peor respaldado de los 11 activos | Sí, `docs/metodologia/reparar-una-fuga.md` | 0 muestras | — | **B** | Ninguna muestra real; sin fuente mejor para materiales | — |
| Alicatar un baño | `disponible` | Cronoshare (B, sembrada); Leroy Merlin (nueva, tarifa real y estructurada) | Mejor tarifa de mano de obra real del catálogo | Sí, `docs/metodologia/alicatar-un-bano.md` | 0 muestras | — | **B** | Ninguna muestra real | Verificar y sustituir por tarifa Leroy Merlin |
| Levantar un tabique | `disponible` | Habitissimo (B, sembrada); BDCCM Madrid (nuevo, organismo público) | El único con indicio de fuente de organismo público | Sí, `docs/metodologia/levantar-un-tabique.md` | 0 muestras | — | **B** | Ninguna muestra real; BDCCM sin confirmar acceso | Confirmar acceso a BDCCM |
| Instalar un armario a medida | `disponible` | Habitissimo (B, sembrada); Leroy Merlin mano de obra (nueva) | Mano de obra bien documentada, material sin mejora | Sí, `docs/metodologia/instalar-un-armario-a-medida.md` | 0 muestras | — | **B** | Ninguna muestra real; Egger/Finsa sin precio público | — |
| Cambiar el cuadro eléctrico | `solo_solicitud` | REBT/ITC-BT-17/25/RD 298/2021 (normativa oficial); Tarifas EICI Madrid (organismo público, nueva) | **El más sólido de los 18 en fuentes**, normativa dura + tasa oficial fechada | No | 0 muestras | — | N/A (sin calculadora) | Sin tarifa de fabricante confirmada; sin validación | **Candidato más claro a convertirse en calculadora B en una futura iteración** — no en esta fase |
| Instalar una caldera | `solo_solicitud` | RITE/RD 919/2006 (normativa oficial); coste de boletín consistente entre agregadores | Normativa dura + coste de trámite razonablemente consistente | No | 0 muestras | — | N/A | Sin tarifa de fabricante vigente confirmada | Candidato a calculadora B reforzada en futura iteración |
| Reformar una habitación | `solo_solicitud` | IVE/CYPE/BDCCM dan solo partidas atómicas, no "reforma" agregada | Insuficiente para una fórmula agregada honesta | No (por diseño) | 0 muestras | — | N/A | Variabilidad de alcance real, no de falta de búsqueda | Ninguna — permanece `solo_solicitud` a propósito |
| Reforma integral de vivienda | `solo_solicitud` | Habitissimo (informe con metodología declarada), idealista | Confirma dispersión real: 400-1.500€/m² según 3 fuentes independientes | No (por diseño) | 0 muestras | — | N/A | Variabilidad intrínseca del servicio, no resoluble con más investigación | Ninguna — permanece `solo_solicitud` a propósito |
| Mantenimiento de jardín | `solo_solicitud` | **Convenio estatal de jardinería 2025-2030** (BOE, hallazgo nuevo, tabla salarial única) | Mejora real sobre solo-agregadores: suelo salarial oficial | No | 0 muestras | — | N/A | Sin tarifa de facturación al cliente, solo salario de convenio | **Candidato razonable a calculadora B** en futura iteración |
| Limpieza profunda de vivienda | `solo_solicitud` | Convenios provinciales de limpieza (Madrid, Cataluña, Valencia, Zaragoza) | Viable pero fragmentado por provincia, más complejo que jardinería | No | 0 muestras | — | N/A | Sin convenio estatal único; requiere lógica por provincia | Candidato a calculadora B, con más trabajo de base |
| Reparar una persiana | `solo_solicitud` | Somfy (precio de fabricante real para motor) + agregadores | El componente más caro (motor) tiene precio de fabricante verificable | No | 0 muestras | — | N/A | Sin validación; resto de componentes solo vía agregador | **Candidato razonable a calculadora B** en futura iteración |

## Cómo leer "Confianza justificable"

- **B**: verificado mecánicamente contra la base de datos real el
  2026-09-17 (ver `lib/quality/confidence-gate.ts`), no una suposición.
  Los 11 servicios activos alcanzaron B en esta misma fase al completarse
  su revisión inicial (metodología documentada, alcance definido,
  cobertura geográfica declarada, fuentes no puramente heurísticas,
  revisión formal hecha) — antes de esta fase estaban en C por falta de
  esos metadatos, aunque el precio subyacente no había cambiado.
- **N/A**: no aplica porque el servicio no tiene calculadora
  (`solo_solicitud`), así que no hay ninguna regla de precio que
  clasificar.
- **A**: ninguno todavía, en ningún caso, sin excepción — ver la nota de
  cabecera.

## Nota sobre aire acondicionado (`instalacion`)

No forma parte de los 18 servicios de esta misión, pero por transparencia:
al pasar por el mismo `confidence-gate.ts`, **también computa hoy en C**,
no porque su precio sea peor que el de los 11 nuevos, sino porque nunca
se le rellenaron los nuevos campos de metadatos (`methodologyDocPath`,
`geographicScope`, `lastReviewedAt`) introducidos en esta misión — son
columnas nuevas, añadidas después de que su regla ya existiera. Corregir
esto es una tarea trivial y de bajo riesgo, pero deliberadamente **no se
ha hecho en esta fase** porque no formaba parte del encargo (los 17/18
servicios en cuestión) y tocar la calculadora de referencia sin que se
pidiera sería alcance no solicitado. Se deja registrado aquí para que no
sorprenda si alguien lo comprueba en `/admin/reglas-precio`.

## Próximos candidatos a nueva calculadora (fuera de alcance de esta fase)

Tres de los siete servicios `solo_solicitud` mostraron, en esta
investigación, indicios razonables de poder convertirse en calculadora B
en una iteración futura — nunca en esta, y nunca sin repetir el proceso
completo (fuentes → metodología documentada → revisión → activación):

1. **Mantenimiento de jardín** — gracias al convenio estatal 2025-2030.
2. **Reparar una persiana** — gracias al precio de fabricante Somfy.
3. **Cambiar el cuadro eléctrico** — gracias a la normativa REBT/RITE y
   la tasa oficial de Madrid; el más sólido de los tres.

Ninguno de los tres se ha activado en esta misión: la misión de David
para esta fase fue investigar y documentar, no activar más calculadoras
sin validación — "primero investiga y documenta, después implementa
las calculadoras que cumplan los criterios" se ha seguido literalmente,
y ninguno de estos tres tenía todavía una fórmula completa (variables,
alcance, ejemplos) al cierre de esta fase.
