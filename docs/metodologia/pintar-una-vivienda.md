# Metodología — Pintar una vivienda completa

**Servicio**: `reformas / pintar-una-vivienda`. **Estado**: `disponible`.
**Nivel de confianza justificable hoy**: B.

## 1. Definición exacta del servicio
Pintado de todas las estancias de una vivienda habitada, escalado por
metros cuadrados totales.

## 2. Alcance incluido
Pintura de todas las estancias de la vivienda, con el recargo si las
paredes necesitan tratamiento previo por humedad o grietas.

## 3. Alcance excluido
Mobiliario a mover/proteger si es muy voluminoso, pintura
exterior/fachada, y reformas de otro tipo (electricidad, fontanería).

## 4. Perfil de trabajo estándar
Vivienda habitada, paredes en estado normal salvo que se marque
`requierePreparacionPrevia`.

## 5. Variables que introduce el usuario
- Metros cuadrados totales de la vivienda (`m2`, 20-300 m²).
- Si hay humedad, grietas o desconchones que tratar antes
  (`requierePreparacionPrevia`).

## 6. Variables que no se pueden conocer sin visita
La extensión real de humedad/grietas si existen — el ajuste cubre un
tratamiento previo típico, no una rehabilitación estructural.

## 7. Fórmula de cálculo
```
Precio = (5-15 €/m² × m2) + preparacion_previa(100-300€, si aplica) → subtotal → IVA
```
Un factor `base` por m² + un factor `additive` (importe fijo, no escalado
por m²) condicional.

## 8. Costes fijos
El ajuste de preparación previa es un importe fijo, no escalado por m² —
decisión deliberada: el rango de mercado encontrado (Habitissimo) daba un
importe por intervención, no por m² de superficie afectada.

## 9. Costes variables
El €/m² base (5-15€, rango amplio porque cubre desde pisos pequeños hasta
viviendas grandes, con distinta economía de escala).

## 10. Factores de dificultad
Solo el de preparación previa, marcado como C (sin desglose de mercado).

## 11. Factores geográficos
Ninguno modelado.

## 12. Factores de urgencia
No aplica.

## 13. Costes adicionales
Ninguno más.

## 14. Tratamiento del IVA
`groupKey: "servicio"` en ambos → elegible a reducido si procede.

## 15. Rango final
Ejemplo (80m², sin preparación previa): `80 × 5-15€ = 400-1200€` + IVA.

## 16. Nivel de incertidumbre
Mixto B/C → banda media/ancha.

## 17. Casos en los que no debe calcularse un precio
Vivienda con daños estructurales por humedad, o que requiera
rehabilitación más allá de pintura — fuera de alcance.

## 18. Ejemplo de cálculo
Vivienda de 100m², con preparación previa: `100 × 5-15€ = 500-1500€ +
100-300€ = 600-1800€` antes de IVA.

## 19. Fuentes de cada componente
Base: Habitissimo — pintar piso completo (confianza B). Preparación
previa: estimación propia (confianza C, sin desglose de mercado
publicado).

## 20. Fecha de revisión
Revisión inicial: 2026-09-17. Próxima revisión debida: 2027-09-17.
