# Metodología — Alicatar un baño

**Servicio**: `reformas / alicatar-un-bano`. **Estado**: `disponible`.
**Nivel de confianza justificable hoy**: B.

## 1. Definición exacta del servicio
Colocación de alicatado (azulejo) en las paredes de un baño, sobre una
superficie ya preparada, con opción de retirar el alicatado antiguo.

## 2. Alcance incluido
El material de agarre y la colocación del alicatado por m², con el
recargo si hay que retirar uno viejo antes.

## 3. Alcance excluido
El azulejo en sí (su precio varía mucho según gama y no está incluido),
impermeabilización si hace falta, y fontanería/sanitarios.

## 4. Perfil de trabajo estándar
Pared preparada y a plomo, sin necesidad de impermeabilización adicional.

## 5. Variables que introduce el usuario
- Metros cuadrados a alicatar (`m2`, 2-30 m²).
- Si hay que retirar el alicatado viejo antes
  (`retirarAlicatadoAntiguo`).

## 6. Variables que no se pueden conocer sin visita
El estado de la superficie bajo el alicatado antiguo, una vez retirado —
puede requerir preparación adicional no cubierta por este rango.

## 7. Fórmula de cálculo
```
Precio = (25-60 €/m² × m2) + retirar_antiguo(100-250€, si aplica) → subtotal → IVA
```
Un factor `base` por m² + un `additive` (importe fijo) condicional.

## 8. Costes fijos
El recargo de retirada es un importe fijo, no escalado por m² —
consistente con que las fuentes de mercado dan el recargo como
intervención, no por m² de superficie a retirar.

## 9. Costes variables
El €/m² base (25-60€, explícitamente sin el azulejo).

## 10. Factores de dificultad
Solo el de retirada, marcado como C.

## 11. Factores geográficos
Ninguno modelado.

## 12. Factores de urgencia
No aplica.

## 13. Costes adicionales
Ninguno más.

## 14. Tratamiento del IVA
`groupKey: "servicio"` en ambos → elegible a reducido si procede — el
azulejo (que sí podría dominar el coste en gama alta) queda
explícitamente fuera del alcance de esta calculadora, por lo que no
distorsiona el cálculo de materiales.

## 15. Rango final
Ejemplo (8m², sin retirar antiguo): `8 × 25-60€ = 200-480€` + IVA.

## 16. Nivel de incertidumbre
Mixto B/C → banda media/ancha.

## 17. Casos en los que no debe calcularse un precio
Si hace falta impermeabilización estructural o el alicatado cubre
superficies muy irregulares — fuera de alcance.

## 18. Ejemplo de cálculo
15m², retirando alicatado antiguo: `15 × 25-60€ = 375-900€ + 100-250€ =
475-1150€` antes de IVA.

## 19. Fuentes de cada componente
Base: Cronoshare — alicatar baño (confianza B). Retirada: estimación
propia (confianza C). Investigación adicional (Leroy Merlin — tarifa real
de mano de obra, 30,50€/m² + incrementos por formato) en
`docs/PRICE-SOURCES-REGISTER.md` §2 — **la mejor tarifa de mano de obra
real encontrada de todo el catálogo**, estructurada con incrementos
explícitos; candidata fuerte para sustituir el rango actual de Cronoshare
en una futura revisión, una vez verificada directamente.

## 20. Fecha de revisión
Revisión inicial: 2026-09-17. Próxima revisión debida: 2027-09-17.
