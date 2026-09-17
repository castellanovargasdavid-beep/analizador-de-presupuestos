# Metodología — Instalar un armario a medida

**Servicio**: `exterior-y-mantenimiento / instalar-un-armario-a-medida`. **Estado**: `disponible`.
**Nivel de confianza justificable hoy**: B.

## 1. Definición exacta del servicio
Fabricación e instalación de un armario empotrado a medida, según el
material del frente elegido, por metro lineal de hueco.

## 2. Alcance incluido
El armario a medida completo (estructura, puertas, interior básico) según
el material del frente, por metro lineal.

## 3. Alcance excluido
Interiores muy elaborados (cajoneras especiales, iluminación
integrada...), el desmontaje de un armario anterior, y remates de obra si
el hueco no es regular.

## 4. Perfil de trabajo estándar
Hueco regular ya existente, sin necesidad de obra de albañilería previa.

## 5. Variables que introduce el usuario
- Material del frente: laminado / MDF lacado / madera maciza
  (`material`).
- Metros lineales de armario (`ml`, 0.5-8 ml).

## 6. Variables que no se pueden conocer sin visita
La regularidad real del hueco — un hueco irregular puede exigir remates
de obra no incluidos.

## 7. Fórmula de cálculo
```
Precio = precio_por_ml(material) × ml → subtotal → IVA
```
Tres factores `base` mutuamente excluyentes según `material`, todos
escalados por `ml`.

## 8. Costes fijos
Ninguno — todo escala con metros lineales.

## 9. Costes variables
El €/ml según material: laminado 250-450€/ml, MDF lacado 400-700€/ml,
madera maciza 600-900€/ml.

## 10. Factores de dificultad
Ninguno modelado más allá de la elección de material.

## 11. Factores geográficos
Ninguno modelado.

## 12. Factores de urgencia
No aplica.

## 13. Costes adicionales
Ninguno más.

## 14. Tratamiento del IVA — nota importante
**`groupKey: "equipo"` en los tres factores**, no `"servicio"` — igual
razón que en "instalar un termo eléctrico": el mueble en sí domina
claramente el coste (es, en esencia, un producto fabricado a medida, no
solo mano de obra), de forma análoga al equipo de aire acondicionado. Este
fue el segundo servicio afectado por el bug de groupKey ya corregido (ver
Addendum 3 de `docs/MVP-COMPLETION-AUDIT.md`) — corregido de v1 a v2 de
forma no destructiva. Como resultado, tributa siempre al tipo general
(21%).

## 15. Rango final
Ejemplo (2ml de laminado): `2 × 250-450€ = 500-900€` + IVA general.

## 16. Nivel de incertidumbre
Los tres factores son B → banda de incertidumbre calculada
automáticamente, moderada (no hay factores C en este servicio, a
diferencia de la mayoría de los otros 10).

## 17. Casos en los que no debe calcularse un precio
Huecos muy irregulares que requieran obra de albañilería previa, o
interiores muy elaborados — fuera de alcance.

## 18. Ejemplo de cálculo
3ml de MDF lacado: `3 × 400-700€ = 1200-2100€` antes de IVA general
(verificado manualmente durante la corrección del bug de groupKey — ver
Addendum 3 de `docs/MVP-COMPLETION-AUDIT.md`).

## 19. Fuentes de cada componente
Los tres factores: Habitissimo — armario a medida (confianza B).
Investigación adicional (Leroy Merlin — tarifa real y estructurada de
mano de obra, 120€/ml + 36,50€/ml por puertas; Egger, Finsa sin precio
público encontrado) en `docs/PRICE-SOURCES-REGISTER.md` §2 — la mano de
obra tiene ahora una fuente potencialmente mejor que la actual; el
material del frente sigue sin respaldo mejor que agregador.

## 20. Fecha de revisión
Revisión inicial: 2026-09-17 (incluye confirmación explícita de que el
groupKey "equipo" y el IVA general son correctos tras el bug ya
corregido). Próxima revisión debida: 2027-09-17.
