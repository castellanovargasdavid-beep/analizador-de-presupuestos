# Metodología — Instalar puntos de luz

**Servicio**: `instalaciones / instalar-puntos-de-luz`. **Estado**: `disponible`.
**Nivel de confianza justificable hoy**: B.

## 1. Definición exacta del servicio
Instalación de uno o varios puntos de luz nuevos en una vivienda ya
construida, con o sin apertura de rozas para el cableado.

## 2. Alcance incluido
El punto de luz (mecanismo + instalación), con o sin apertura de rozas
para el cableado nuevo.

## 3. Alcance excluido
La lámpara o luminaria en sí, el reguetado eléctrico general de la
vivienda, y el repintado de la zona afectada por las rozas.

## 4. Perfil de trabajo estándar
Instalación eléctrica existente con capacidad suficiente; techo o pared
accesible para el punto nuevo.

## 5. Variables que introduce el usuario
- Número de puntos de luz (`numPuntos`, 1-15, escala el precio).
- Cómo se instalan: accesible sin abrir rozas, o con rozas/cableado nuevo
  (`tipoInstalacion`).

## 6. Variables que no se pueden conocer sin visita
La distancia real hasta el punto de suministro eléctrico más cercano —
determina si "con rozas" cae en la parte baja o alta del rango.

## 7. Fórmula de cálculo
```
Precio = base(tipoInstalacion) × numPuntos → subtotal → IVA
```
Dos factores `base` mutuamente excluyentes, ambos escalados por
`numPuntos`.

## 8. Costes fijos
Ninguno — todo escala con el número de puntos.

## 9. Costes variables
El €/punto según instalación accesible (40-120€) o con rozas (150-350€).

## 10. Factores de dificultad
La distinción accesible/con rozas es el único factor de dificultad
modelado.

## 11. Factores geográficos
Ninguno modelado.

## 12. Factores de urgencia
No aplica.

## 13. Costes adicionales
Ninguno más.

## 14. Tratamiento del IVA
`groupKey: "servicio"` en ambos → elegible a reducido si procede.

## 15. Rango final
Ejemplo (2 puntos accesibles): `2 × 40-120€ = 80-240€` + IVA.

## 16. Nivel de incertidumbre
Ambos factores son B → banda de incertidumbre calculada
automáticamente, moderada.

## 17. Casos en los que no debe calcularse un precio
Si se necesita reguetado eléctrico general o ampliación de potencia —
fuera de alcance.

## 18. Ejemplo de cálculo
3 puntos con rozas: `3 × 150-350€ = 450-1050€` antes de IVA.

## 19. Fuentes de cada componente
Ambos factores: Cronoshare — instalar punto de luz (confianza B).
Investigación adicional (CYPE — interruptor empotrado 11-15€, pero sin
partida de "punto de luz completo") en
`docs/PRICE-SOURCES-REGISTER.md` §2 — este es el servicio de los 11
activos con menos respaldo propio más allá de agregadores; queda
pendiente reconstruir manualmente sumando cable+interruptor+mano de obra
en una futura revisión.

## 20. Fecha de revisión
Revisión inicial: 2026-09-17. Próxima revisión debida: 2027-09-17.
