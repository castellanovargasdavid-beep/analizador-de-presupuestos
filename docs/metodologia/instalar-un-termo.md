# Metodología — Instalar un termo eléctrico

**Servicio**: `instalaciones / instalar-un-termo`. **Estado**: `disponible`.
**Nivel de confianza justificable hoy**: B.

## 1. Definición exacta del servicio
Instalación de un termo eléctrico nuevo en sustitución de uno existente
(o primera instalación en un punto ya preparado), incluyendo la retirada
del antiguo si lo hay.

## 2. Alcance incluido
La mano de obra de instalar el termo nuevo y retirar el antiguo si lo
hay, con un ajuste si se necesita uno de gran capacidad.

## 3. Alcance excluido
El propio termo si se compra aparte (aquí se estima el conjunto), adaptar
la instalación eléctrica si no cumple normativa, y crear el desagüe desde
cero si no existe.

## 4. Perfil de trabajo estándar
Punto ya preparado con toma eléctrica y desagüe existentes.

## 5. Variables que introduce el usuario
- Si necesita un termo grande, de más de 100 litros
  (`capacidadGrande`).

## 6. Variables que no se pueden conocer sin visita
Si la instalación eléctrica del punto cumple la normativa vigente para el
termo elegido, y si el desagüe existente es reutilizable.

## 7. Fórmula de cálculo
```
Precio = base(200-400€) × capacidad_grande(1.0 o 1.2-1.5) → subtotal → IVA
```
Un factor `base` plano + un factor `multiplier` condicional a
`capacidadGrande`.

## 8. Costes fijos
La base (200-400€), que ya incluye el termo + instalación + retirada
según la fuente de mercado usada (Habitissimo no desglosa material de
mano de obra por separado para este servicio).

## 9. Costes variables
El multiplicador de capacidad grande (×1.2-1.5).

## 10. Factores de dificultad
Solo el de capacidad, marcado como C (sin desglose de mercado por
litraje).

## 11. Factores geográficos
Ninguno modelado.

## 12. Factores de urgencia
No aplica.

## 13. Costes adicionales
Ninguno más.

## 14. Tratamiento del IVA — nota importante
**`groupKey: "equipo"`, no `"servicio"`** — a diferencia de la mayoría de
servicios de esta tanda. Esto es deliberado: el termo en sí (el producto)
domina claramente el coste, de forma análoga al equipo de aire
acondicionado, así que el cálculo de materiales no debe asumir por
defecto un 0% de materiales. Un bug real donde esto se sembró
incorrectamente como `"servicio"` se detectó y corrigió durante la fase
de activación de este servicio (ver Addendum 3 de
`docs/MVP-COMPLETION-AUDIT.md`) — esta es exactamente la clase de error
que esta revisión inicial busca prevenir en el futuro. Como resultado,
este servicio tributa siempre al tipo general (21%), nunca al reducido.

## 15. Rango final
Ejemplo (termo estándar): 200-400€ + IVA general (21%).

## 16. Nivel de incertidumbre
Mixto B/C → banda media/ancha.

## 17. Casos en los que no debe calcularse un precio
Primera instalación sin punto preparado (sin toma eléctrica ni desagüe
existentes) — fuera de alcance, requiere presupuesto directo.

## 18. Ejemplo de cálculo
Termo grande: `200-400€ × 1.2-1.5 = 240-600€` antes de IVA general.

## 19. Fuentes de cada componente
Base: Habitissimo — instalar o cambiar termo eléctrico (confianza B).
Capacidad grande: estimación propia (confianza C). Investigación
adicional (Cointra, Junkers/Bosch, Fleck, todas con tarifas de fabricante
reales pero desactualizadas 2022-2024) en
`docs/PRICE-SOURCES-REGISTER.md` §2 — el candidato más claro de todo el
catálogo para conseguir una fuente `catalogo_real` verificada, si se
confirma la tarifa vigente 2026 de alguno de los tres fabricantes.

## 20. Fecha de revisión
Revisión inicial: 2026-09-17 (incluye confirmación explícita de que el
groupKey "equipo" y el IVA general son correctos tras el bug ya
corregido). Próxima revisión debida: 2027-09-17.
