# Metodología — Levantar un tabique

**Servicio**: `reformas / levantar-un-tabique`. **Estado**: `disponible`.
**Nivel de confianza justificable hoy**: B.

## 1. Definición exacta del servicio
Construcción de un tabique divisorio nuevo dentro de una vivienda, en
pladur o ladrillo, sin acabado final.

## 2. Alcance incluido
Material y mano de obra de levantar el tabique según el material elegido,
por metro cuadrado.

## 3. Alcance excluido
El acabado final (pintura, alicatado...), la instalación eléctrica dentro
del tabique si se necesita, y permisos/licencias si la obra los requiere.

## 4. Perfil de trabajo estándar
Espacio despejado y accesible, sin necesidad de refuerzo estructural
especial.

## 5. Variables que introduce el usuario
- Material: pladur o ladrillo (`material`).
- Metros cuadrados del tabique (`m2`, 2-40 m²).

## 6. Variables que no se pueden conocer sin visita
El estado del suelo/techo donde se ancla el tabique y si requiere
refuerzo estructural no estándar.

## 7. Fórmula de cálculo
```
Precio = precio_por_m2(material) × m2 → subtotal → IVA
```
Dos factores `base` mutuamente excluyentes según `material`, ambos
escalados por `m2`.

## 8. Costes fijos
Ninguno — todo escala con m².

## 9. Costes variables
El €/m² según material: pladur 20-50€/m², ladrillo 12-40€/m² (el pladur
es más caro por metro pero más rápido de instalar; el rango se solapa
porque la calidad de acabado y el grosor varían dentro de cada material).

## 10. Factores de dificultad
Ninguno modelado más allá de la elección de material.

## 11. Factores geográficos
Ninguno modelado.

## 12. Factores de urgencia
No aplica.

## 13. Costes adicionales
Ninguno más.

## 14. Tratamiento del IVA
`groupKey: "servicio"` en ambos → elegible a reducido si procede.

## 15. Rango final
Ejemplo (10m² de pladur): `10 × 20-50€ = 200-500€` + IVA.

## 16. Nivel de incertidumbre
Ambos factores son B → banda de incertidumbre calculada
automáticamente, moderada.

## 17. Casos en los que no debe calcularse un precio
Tabiques que formen parte de una reforma estructural más amplia, o que
requieran refuerzo especial — fuera de alcance.

## 18. Ejemplo de cálculo
15m² de ladrillo: `15 × 12-40€ = 180-600€` antes de IVA.

## 19. Fuentes de cada componente
Ambos factores: Habitissimo — construir tabique (confianza B).
Investigación adicional: la **Base de Precios de la Construcción de la
Comunidad de Madrid (BDCCM)**, un organismo público con partidas
descompuestas reales (ver `docs/PRICE-SOURCES-REGISTER.md` §1 y §2), es
el hallazgo más prometedor de toda esta investigación para este
servicio — pendiente de confirmar acceso libre y vigencia antes de
sustituir la fuente actual.

## 20. Fecha de revisión
Revisión inicial: 2026-09-17. Próxima revisión debida: 2027-09-17.
