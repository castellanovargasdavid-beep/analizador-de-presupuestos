# Metodología — Cambiar una cerradura

**Servicio**: `exterior-y-mantenimiento / cambiar-una-cerradura`. **Estado**: `disponible`.
**Nivel de confianza justificable hoy**: B.

## 1. Definición exacta del servicio
Sustitución de una cerradura existente por una nueva, en la misma puerta,
sin cambiar la puerta ni el marco.

## 2. Alcance incluido
La cerradura según el nivel de seguridad elegido, el desmontaje de la
antigua y la instalación de la nueva, y el recargo si se necesita con
urgencia.

## 3. Alcance excluido
Reparar o reforzar el marco de la puerta si está dañado, cambiar la
puerta completa, y cerraduras adicionales (el rango es para una unidad).

## 4. Perfil de trabajo estándar
Puerta y marco en buen estado, sustitución 1:1 sin adaptación estructural.

## 5. Variables que introduce el usuario
- Nivel de seguridad: estándar / seguridad-blindada / electrónica
  (`nivelSeguridad`).
- Si lo necesita hoy o fuera de horario habitual (`urgente`).

## 6. Variables que no se pueden conocer sin visita
El estado real del bombín/marco y si la cerradura nueva encaja sin
adaptación — un desajuste de medidas puede exigir trabajo adicional de
carpintería no cubierto por este rango.

## 7. Fórmula de cálculo
```
Precio = base(nivelSeguridad) + recargo_urgencia(si aplica) → subtotal → IVA
```
Tres factores `base` mutuamente excluyentes (uno por nivel) + un factor
`additive` condicional a `urgente`.

## 8. Costes fijos
Ninguno — todo el precio depende del nivel elegido.

## 9. Costes variables
El recargo de urgencia (50-150€).

## 10. Factores de dificultad
Implícitos en la elección de nivel: estándar 80-200€, seguridad/blindada
200-500€, electrónica 350-600€ — la dispersión refleja la variedad real
de productos dentro de cada categoría, no solo la instalación.

## 11. Factores geográficos
Ninguno modelado.

## 12. Factores de urgencia
Recargo explícito de 50-150€, con fuente de mercado (no heurística
propia) — a diferencia de otros servicios donde la urgencia es un ajuste
sin desglose.

## 13. Costes adicionales
Ninguno más.

## 14. Tratamiento del IVA
`groupKey: "servicio"` en los tres factores base → elegible a IVA
reducido si el cliente cumple los requisitos legales — razonable, ya que
incluso la cerradura electrónica de gama alta no está claramente dominada
por "equipo" en el sentido que exige la ley (a diferencia de un termo o
un armario a medida completo).

## 15. Rango final
Ejemplo (cerradura estándar, sin urgencia): 80-200€ + IVA.

## 16. Nivel de incertidumbre
Todos los factores son B → banda de incertidumbre calculada
automáticamente, más estrecha que en servicios con factores C.

## 17. Casos en los que no debe calcularse un precio
Si hay que sustituir también la puerta o reforzar el marco — fuera del
alcance de esta calculadora; el usuario debería pedir presupuesto directo.

## 18. Ejemplo de cálculo
Cerradura de seguridad, con urgencia: `200-500€ (base) + 50-150€
(urgencia) = 250-650€` antes de IVA.

## 19. Fuentes de cada componente
Los cuatro factores (tres bases + urgencia): Cronoshare — cerrajero
(confianza B). Investigación adicional de fabricantes (CVL, TESA) en
`docs/PRICE-SOURCES-REGISTER.md` §2 — no verificada, no incorporada; es
el servicio peor respaldado en fuentes de fabricante de todo el catálogo.

## 20. Fecha de revisión
Revisión inicial: 2026-09-17. Próxima revisión debida: 2027-09-17.
