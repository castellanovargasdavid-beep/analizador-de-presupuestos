# Metodología — Cambiar un grifo

**Servicio**: `instalaciones / cambiar-un-grifo`. **Estado**: `disponible`.
**Nivel de confianza justificable hoy**: B (ver `docs/CALCULATOR-QUALITY-STANDARD.md`).

## 1. Definición exacta del servicio
Sustitución de un grifo existente (de fregadero, lavabo, ducha o bañera)
por uno nuevo, en una vivienda ya habitada, sin cambiar la disposición de
las tomas de agua.

## 2. Alcance incluido
El precio del grifo (monomando o termostático), la mano de obra de
desmontar el antiguo y montar el nuevo, y un ajuste si hace falta adaptar
la tubería o repicar un poco de alicatado.

## 3. Alcance excluido
El propio grifo si el usuario lo compra aparte (aquí se estima el
conjunto), reformas de fontanería más amplias, y el IVA de materiales si
los aporta el usuario.

## 4. Perfil de trabajo estándar
Vivienda ya construida, grifo antiguo funcional que se retira, sin
necesidad de cambiar la posición de la salida de agua.

## 5. Variables que introduce el usuario
- Tipo de grifo: fregadero/lavabo o ducha/bañera (`tipoGrifo`).
- Si necesita adaptar la tubería o un pequeño trabajo de albañilería
  (`requiereAdaptacion`).

## 6. Variables que no se pueden conocer sin visita
El estado real de la llave de paso y de las conexiones existentes (si
están oxidadas o rotas, el trabajo puede complicarse más allá del ajuste
que cubre este rango).

## 7. Fórmula de cálculo
```
Precio = base(tipoGrifo) + adaptación(si aplica) → subtotal → IVA
```
- **Base** (`base_fregadero_lavabo` / `base_ducha_banera`): factor `base`,
  plano (no depende de cantidad).
- **Adaptación** (`adaptacion_tuberia`): factor `additive`, se suma solo
  si `requiereAdaptacion` es verdadero.

## 8. Costes fijos
El precio del grifo en sí, integrado en la base (no se desglosa aparte
porque las fuentes de mercado ya lo dan como conjunto grifo+instalación).

## 9. Costes variables
El ajuste de adaptación, condicional al caso.

## 10. Factores de dificultad
Implícitos en la elección "ducha/bañera" (rango más alto y más ancho,
80-240€, que refleja la mayor variedad de termostáticos) frente a
"fregadero/lavabo" (60-100€, monomando estándar).

## 11. Factores geográficos
Ninguno modelado — cobertura declarada: España, sin diferenciación
autonómica (ver limitación en `docs/PRICE-SOURCES-REGISTER.md`).

## 12. Factores de urgencia
No modelados para este servicio (a diferencia de cerradura o fuga, donde
sí hay evidencia de mercado de recargo por urgencia).

## 13. Costes adicionales
Ninguno más allá de la adaptación de tubería.

## 14. Tratamiento del IVA
`groupKey: "servicio"` en ambos factores base → no cuentan como "equipo"
a efectos del cálculo de materiales, por lo que es elegible al 10%
reducido si el cliente cumple los tres requisitos legales (persona
física, uso particular, vivienda >2 años) — correcto, porque en este
servicio la mano de obra domina sobre el coste del grifo en sí.

## 15. Rango final
Ejemplo (grifo de fregadero/lavabo, sin adaptación): 60-100€ + IVA.

## 16. Nivel de incertidumbre
Mixto B/C (la base es B, el ajuste de adaptación es C por falta de
desglose de mercado específico) → banda de incertidumbre media/ancha,
calculada automáticamente por `lib/estimation/uncertainty.ts`.

## 17. Casos en los que no debe calcularse un precio
Si hay que mover la toma de agua de sitio, o si es una instalación nueva
(no sustitución) — el formulario no cubre ese caso; el usuario debería
usar la solicitud directa de presupuesto.

## 18. Ejemplo de cálculo
Grifo de ducha/bañera, con adaptación de tubería:
`80-240€ (base) + 20-60€ (adaptación) = 100-300€` antes de IVA.

## 19. Fuentes de cada componente
- Base (ambas variantes): Habitissimo — cambiar grifo (confianza B, ver
  `data_sources`).
- Adaptación de tubería: estimación propia, sin desglose de mercado
  (confianza C, documentado explícitamente en `pricing_factors.notes`).
- Investigación adicional de fuentes de fabricante (Roca, CYPE) en
  `docs/PRICE-SOURCES-REGISTER.md` §2 — no verificada todavía, no
  incorporada a esta fórmula.

## 20. Fecha de revisión
Revisión inicial: 2026-09-17 (comprobación de fuentes, alcance, groupKey
e IVA — ver `docs/CALCULATOR-REVIEW-PROCESS.md` §2.1). Próxima revisión
debida: 2027-09-17.
