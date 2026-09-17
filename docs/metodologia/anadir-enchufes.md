# Metodología — Añadir enchufes

**Servicio**: `instalaciones / anadir-enchufes`. **Estado**: `disponible`.
**Nivel de confianza justificable hoy**: B.

## 1. Definición exacta del servicio
Instalación de uno o varios enchufes nuevos en una vivienda ya
construida, con o sin tendido de cableado nuevo.

## 2. Alcance incluido
El mecanismo y la instalación de cada enchufe nuevo, con o sin cableado
nuevo hasta el punto.

## 3. Alcance excluido
Ampliar la potencia contratada, cambiar el cuadro eléctrico (es un
servicio aparte), y obra de albañilería para ocultar rozas si son
extensas.

## 4. Perfil de trabajo estándar
Instalación eléctrica existente en buen estado, con capacidad suficiente
para los enchufes nuevos.

## 5. Variables que introduce el usuario
- Número de enchufes nuevos (`numEnchufes`, 1-15, escala el precio por
  unidad).
- Cómo se instalan: sobre cableado existente o con cableado nuevo
  (`tipoInstalacion`).

## 6. Variables que no se pueden conocer sin visita
Si la instalación eléctrica existente tiene capacidad y accesibilidad
suficiente para el tendido nuevo sin complicaciones.

## 7. Fórmula de cálculo
```
Precio = base(tipoInstalacion) × numEnchufes → subtotal → IVA
```
Dos factores `base` mutuamente excluyentes, ambos escalados por
`numEnchufes`.

## 8. Costes fijos
Ninguno — todo escala con el número de enchufes.

## 9. Costes variables
El €/enchufe según si hay que tender cable nuevo (30-60€ sobre cableado
existente, 80-150€ con cableado nuevo).

## 10. Factores de dificultad
La distinción cableado existente/nuevo es el único factor de dificultad
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
Ejemplo (2 enchufes sobre cableado existente): `2 × 30-60€ = 60-120€` +
IVA.

## 16. Nivel de incertidumbre
Mixto B/C: el factor de cableado existente es B (Habitissimo), el de
cableado nuevo es C — la investigación solo dio un precio por metro de
cable (~80€/m), no por enchufe con cableado nuevo completo, así que este
rango es una combinación propia razonable, documentada como tal en
`pricing_factors.notes`.

## 17. Casos en los que no debe calcularse un precio
Si la instalación requiere ampliar la potencia contratada o tocar el
cuadro eléctrico — son servicios aparte.

## 18. Ejemplo de cálculo
5 enchufes con cableado nuevo: `5 × 80-150€ = 400-750€` antes de IVA.

## 19. Fuentes de cada componente
Cableado existente: Habitissimo — instalar enchufes (confianza B).
Cableado nuevo: estimación propia (confianza C). Investigación adicional
(CYPE — mecanismo empotrado 11-15€, cable por metro 0,90-1,41€/m) en
`docs/PRICE-SOURCES-REGISTER.md` §2 — no verificada, no incorporada
todavía, pero es un candidato razonable para sustituir el factor C actual
por uno mejor fundamentado en una futura revisión.

## 20. Fecha de revisión
Revisión inicial: 2026-09-17. Próxima revisión debida: 2027-09-17.
