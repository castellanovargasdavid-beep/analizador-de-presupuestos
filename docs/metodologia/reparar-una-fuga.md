# Metodología — Reparar una fuga

**Servicio**: `instalaciones / reparar-una-fuga`. **Estado**: `disponible`.
**Nivel de confianza justificable hoy**: B.

## 1. Definición exacta del servicio
Localización y reparación de una fuga de agua puntual en una vivienda,
sin sustitución de tramos largos de tubería.

## 2. Alcance incluido
Localización y reparación de la fuga, con recargo si la tubería está
empotrada (hay que picar) o si se necesita con urgencia.

## 3. Alcance excluido
Reponer el acabado final (alicatado, pintura...) más allá de un arreglo
básico, sustituir tramos largos de tubería, y daños ya causados por la
fuga (humedades, muebles...).

## 4. Perfil de trabajo estándar
Fuga puntual localizable (junta, latiguillo, tramo corto), no un problema
sistémico de toda la instalación.

## 5. Variables que introduce el usuario
- Si la tubería está empotrada en pared o suelo (`tuberiaEmpotrada`).
- Si es una fuga activa y se necesita que venga hoy (`urgente`).

## 6. Variables que no se pueden conocer sin visita
El origen exacto de la fuga y la extensión del picado necesario si está
empotrada — el ajuste cubre un caso típico, no una reforma de fontanería.

## 7. Fórmula de cálculo
```
Precio = base(80-180€) + tuberia_empotrada(100-300€, si aplica) × urgencia(1.0 o 1.5-2.0, si aplica) → subtotal → IVA
```
Un factor `base` plano, un `additive` condicional, y un `multiplier`
condicional sobre el subtotal.

## 8. Costes fijos
La base (fuga visible y accesible).

## 9. Costes variables
El recargo de tubería empotrada y el multiplicador de urgencia.

## 10. Factores de dificultad
La tubería empotrada es el factor de dificultad principal, marcado como C
(la investigación no encontró un rango de mercado agregado específico
para este caso, así que se modela como recargo estimado — documentado
explícitamente en `pricing_factors.notes`).

## 11. Factores geográficos
Ninguno modelado.

## 12. Factores de urgencia
Multiplicador ×1.5-2.0, con fuente de mercado (confianza B, no
heurística).

## 13. Costes adicionales
Ninguno más.

## 14. Tratamiento del IVA
`groupKey: "servicio"` en todos → elegible a reducido si procede.

## 15. Rango final
Ejemplo (fuga visible, sin urgencia): 80-180€ + IVA.

## 16. Nivel de incertidumbre
Mixto B/C → banda media/ancha.

## 17. Casos en los que no debe calcularse un precio
Si la fuga afecta a una tubería principal o requiere sustitución de un
tramo largo — fuera de alcance, requiere presupuesto directo.

## 18. Ejemplo de cálculo
Fuga empotrada y urgente: `(80-180€ + 100-300€) × 1.5-2.0 = 270-960€`
antes de IVA.

## 19. Fuentes de cada componente
Base y urgencia: Habitissimo — reparar fuga de agua (confianza B).
Tubería empotrada: estimación propia (confianza C). Investigación
adicional: no se encontró ninguna fuente mejor que agregador para
materiales de reparación menor — es, junto con "instalar puntos de luz",
el servicio con menos margen de mejora de fuente de los 11 activos (ver
`docs/PRICE-SOURCES-REGISTER.md` §2).

## 20. Fecha de revisión
Revisión inicial: 2026-09-17. Próxima revisión debida: 2027-09-17.
