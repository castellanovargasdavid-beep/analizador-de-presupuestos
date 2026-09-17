# Metodología — Pintar una habitación

**Servicio**: `reformas / pintar-una-habitacion`. **Estado**: `disponible`.
**Nivel de confianza justificable hoy**: B.

## 1. Definición exacta del servicio
Pintado de paredes de una habitación en una vivienda habitada, con el
número de manos habitual para un acabado normal.

## 2. Alcance incluido
Pintura de paredes (y el recargo si hay que quitar gotelé o alisar mucho
antes), con el número de manos habitual para un acabado normal.

## 3. Alcance excluido
El techo salvo que se indique al pedir presupuesto, la pintura de
puertas/marcos/radiadores, y tratamientos especiales de humedad.

## 4. Perfil de trabajo estándar
Paredes en buen estado bajo la capa actual, sin necesidad de tratamiento
especial más allá del gotelé/alisado si se marca esa opción.

## 5. Variables que introduce el usuario
- Metros cuadrados de la habitación (`m2`, 4-60 m², factor `base`
  escalado por `perUnitOfQuantity`).
- Si hay que quitar gotelé o alisar mucho las paredes (`quitarGotele`).

## 6. Variables que no se pueden conocer sin visita
El estado real bajo la pintura actual (humedad, grietas estructurales)
que pueda exigir más preparación de la que cubre el ajuste de gotelé.

## 7. Fórmula de cálculo
```
Precio = (4-6 €/m² × m2) × ajuste_gotele(1.0 o 1.4-1.8) → subtotal → IVA
```
Un factor `base` por m² (`perUnitOfQuantity: "m2"`) y un factor
`multiplier` condicional (`ajuste_gotele`) que se aplica sobre el
subtotal si `quitarGotele` es verdadero.

## 8. Costes fijos
Ninguno modelado explícitamente — el precio escala linealmente con m².

## 9. Costes variables
El propio €/m² (4-6€) y el multiplicador de gotelé (×1.4-1.8).

## 10. Factores de dificultad
El ajuste de gotelé es el único factor de dificultad modelado, y tiene
fuente de mercado propia (no es heurística).

## 11. Factores geográficos
Ninguno modelado.

## 12. Factores de urgencia
No aplica a este servicio.

## 13. Costes adicionales
Ninguno más allá del gotelé.

## 14. Tratamiento del IVA
`groupKey: "servicio"` → elegible a reducido si el cliente cumple
requisitos — correcto, la pintura y mano de obra no son "equipo" en
sentido legal.

## 15. Rango final
Ejemplo (habitación de 12m², sin gotelé): `12 × 4-6€ = 48-72€` + IVA.

## 16. Nivel de incertidumbre
Ambos factores son B → banda de incertidumbre calculada automáticamente,
relativamente estrecha.

## 17. Casos en los que no debe calcularse un precio
Si hay humedad estructural, moho extenso, o se requiere alisado de
paredes muy dañadas más allá de gotelé — el rango no lo cubre.

## 18. Ejemplo de cálculo
Habitación de 20m², con gotelé: `20 × 4-6€ = 80-120€`, ×1.4-1.8 =
`112-216€` antes de IVA.

## 19. Fuentes de cada componente
Ambos factores: Cronoshare — pintar habitación (confianza B).
Investigación adicional (Titan, Bruguer, CYPE) en
`docs/PRICE-SOURCES-REGISTER.md` §2 — confirma rendimiento de pintura
(m²/litro) pero no separa limpiamente material de mano de obra; no
incorporada todavía a esta fórmula.

## 20. Fecha de revisión
Revisión inicial: 2026-09-17. Próxima revisión debida: 2027-09-17.
