# Investigación de precios de mercado — servicios pendientes de calculadora

Investigación real vía WebSearch (septiembre 2026) para los 17 servicios
del catálogo que hoy están en `proximamente`/`solo_solicitud`, con el
mismo objetivo que tuvo `docs/01-investigacion-precios-aire-acondicionado.md`
para aire acondicionado: encontrar fuentes reales y citables antes de
construir cualquier calculadora. **Ninguna cifra de este documento se ha
usado todavía para activar nada** — es la base para decidir, servicio a
servicio, si hay datos suficientes para construir una calculadora real.

## Conclusión general (léela antes que las tablas)

**Para ninguno de los 17 servicios existe una fuente de confianza A**
(oficial/normativa o estudio con metodología y muestra publicadas), a
diferencia de aire acondicionado, que se apoya en RITE/IDAE. El techo de
confianza alcanzable en todos los casos es **B**: agregadores de
presupuestos (Habitissimo, Cronoshare, en menor medida idealista) que
declaran usar "presupuestos reales revisados por expertos", pero sin
publicar tamaño de muestra ni metodología estadística verificable por
servicio. Ningún estudio de la OCU ni de un colegio/gremio profesional
con cifras concretas apareció para estos 17 servicios.

Consecuencia práctica si se activan: cada uno debería marcarse con una
**banda de incertidumbre explícitamente mayor** que la de aire
acondicionado (más ancha, y con el aviso de confianza B visible, nunca
presentado con el mismo nivel de fiabilidad que RITE/fabricante). Esto ya
es coherente con cómo está diseñado el sistema (`pricing_factors.confidence`
admite A/B/C por factor).

**Limitación técnica de la propia investigación**: `WebFetch` estuvo
bloqueado hacia `cronoshare.com` y varios dominios de precios en este
entorno (mismo problema ya documentado para A/A) — los datos vienen de
los fragmentos que devuelve la búsqueda, no de leer la página completa.
**Antes de congelar cualquier cifra en una regla de precio real, hay que
abrir cada URL manualmente y confirmar el dato**, exactamente el mismo
protocolo que se siguió para aire acondicionado.

---

## Instalaciones

### Electricista → Añadir enchufes
- **Rango**: 30-60 €/unidad sobre cableado existente; ~80 €/m con cableado nuevo empotrado; ~30 €/m visto con canaleta. Típico: ~50 €/enchufe simple.
- **Factores**: cableado nuevo (y su longitud), empotrado vs. visto, tarifa/hora (20-50 €/h), desplazamiento.
- **Fuentes**: [Habitissimo](https://www.habitissimo.es/presupuestos/instalar-enchufes) (B), [Cronoshare](https://www.cronoshare.com/cuanto-cuesta/electricista-hora) (B).

### Electricista → Cambiar el cuadro eléctrico
- **Rango**: 200-350 € sustitución simple; 350-800 € según circuitos/protecciones; puede superar 1.000 € con boletín/legalización. Típico: ~350-500 €.
- **Factores**: nº de circuitos/diferenciales, si requiere boletín CIE (visita OCA), si se reaprovecha cableado, marca.
- **Fuentes**: [Certicalia](https://www.certicalia.com/blog/cuanto-cuesta-cambiar-cuadro-electrico-casa) (B), [Habitissimo](https://www.habitissimo.es/presupuestos/instalacion-electrica) (B).

### Electricista → Instalar puntos de luz
- **Rango**: 40-120 €/punto sencillo accesible; 150-350 € con rozas/cableado nuevo; 120-250 € mover uno existente. Típico: ~60-120 €/punto.
- **Factores**: rozas o no, distancia al circuito, tipo de punto, nº de puntos (economía de escala).
- **Fuentes**: [Cronoshare](https://www.cronoshare.com/cuanto-cuesta/instalar-punto-luz) (B), [FincaVolt](https://fincavolt.es/blog/precio-punto-luz-vivienda/) (C, consistente con B).

### Fontanero → Cambiar un grifo
- **Rango**: 60-100 € fregadero/lavabo; 80-240 € ducha/bañera (termostático en el extremo alto). Típico: ~100 €.
- **Factores**: tipo de grifo, empotrado vs. visto, si requiere albañilería, desplazamiento, tarifa/hora.
- **Fuentes**: [Habitissimo](https://www.habitissimo.es/presupuestos/cambiar-grifo) (B), [Cronoshare](https://www.cronoshare.com/cuanto-cuesta/cambiar-grifo) (B).

### Fontanero → Instalar un termo eléctrico
- **Rango**: 100-600 €, más habitual 200-400 € (mano de obra, sin aparato). Típico: ~250-300 €.
- **Factores**: capacidad en litros, retirada del antiguo, acceso, adaptación eléctrica/fontanería, marca.
- **Fuentes**: [Habitissimo](https://www.habitissimo.es/presupuestos/instalar-o-cambiar-termo-electrico) (B), [Cronoshare](https://www.cronoshare.com/cuanto-cuesta/instalar-termo-electrico) (B).

### Fontanero → Reparar una fuga (hoy `solo_solicitud`)
- **Rango**: 80-180 € fuga visible/accesible (con desplazamiento e IVA). Empotrada/con picado: sin rango agregado fiable — modelar como factor aditivo estimado (+100-300 €), no como dato de mercado citado. Típico: ~95-150 €.
- **Factores**: visible vs. empotrada, picado y reposición de acabados, equipo de detección, urgencia (+50-100%), tarifa/hora + desplazamiento.
- **Fuentes**: [Habitissimo](https://www.habitissimo.es/presupuestos/reparar-fuga-de-agua) (B), [Cronoshare](https://www.cronoshare.com/cuanto-cuesta/servicio-fontaneria) (B).

### Técnico de calefacción → Instalar una caldera
- **Rango**: sustitución simple caldera de condensación (sin tocar acometida/radiadores) 1.500-3.500 € equipo+instalación; sistema completo en piso 60-80m² 3.300-5.000 €; unifamiliar 4.700-7.500 €; solo equipo 1.000-3.000 €.
- **Factores**: tipo de caldera (condensación obligatoria por RITE), sustitución 1:1 vs. instalación nueva, nº de radiadores/metros de tubería, tipo de vivienda.
- **Fuentes**: [Cronoshare](https://www.cronoshare.com/cuanto-cuesta/instalar-caldera-gas) (B), [Habitissimo](https://www.habitissimo.es/presupuestos/instalar-calefaccion-gas-natural) (B) — dos agregadores independientes coinciden en orden de magnitud.

## Reformas

### Albañil → Alicatar un baño
- **Rango**: 25-30 €/m² gama estándar (Habitissimo: baño 5m² ≈2.000€ total, incluye más que solo alicatado); Cronoshare 700-1.500 € totales (≈40-60 €/m²), extremos 30-100+ €/m².
- **Factores**: tamaño del baño, formato de azulejo, complejidad de cortes, retirada de alicatado viejo, mano de obra local.
- **Fuentes**: [Cronoshare](https://www.cronoshare.com/cuanto-cuesta/alicatar-bano) (B), [Habitissimo](https://www.habitissimo.es/presupuestos/alicatar-bano) (B).

### Albañil → Levantar un tabique
- **Rango**: pladur 20-50 €/m² (más citado 25-35 €/m²); ladrillo 12-40 €/m² material+colocación, o 25-45 €/ml con acabado.
- **Factores**: material, grosor/aislamiento, altura de techo, enlucido/masillado, doble placa.
- **Fuentes**: [Habitissimo](https://www.habitissimo.es/presupuestos/construir-tabique) (B), [Cronoshare](https://www.cronoshare.com/cuanto-cuesta/hacer-tabique) (B) — dispersión notable entre fuentes, no promediar sin criterio.

### Albañil → Reformar una habitación
- **Rango**: básica 70-110 €/m², media 160-300 €/m², alta 200-330 €/m² (mano de obra ≈40%). Total típico 700-3.200 € para 10-15 m².
- **Factores**: alcance (suelo/pintura/electricidad), calidad de materiales, carpintería/armarios incluidos.
- **Fuente**: [Cronoshare](https://www.cronoshare.com/cuanto-cuesta/reformar-habitacion-dormitorio) (B).

### Pintor → Pintar una habitación
- **Rango**: 4-6 €/m² habitual (mercado 3-17 €/m²); total típico 100-600 €/habitación. Quitar gotelé/alisar: +40-80% o +15 €/m².
- **Factores**: nº de manos, emplastecido/lijado, calidad de pintura, color oscuro, techo incluido o no.
- **Fuentes**: [Cronoshare](https://www.cronoshare.com/cuanto-cuesta/pintar-habitacion) (B), [Habitissimo](https://www.habitissimo.es/presupuestos/pintar-habitaciones) (B).

### Pintor → Pintar una vivienda completa
- **Rango**: 5-15 €/m² (más citado 8-15 €/m²). Ejemplos: 60m²≈800€, 70m²≈950€, 120m²≈1.600€.
- **Factores**: superficie total, nº de estancias, estado de paredes (humedad/grietas), calidad de pintura, color.
- **Fuentes**: [Habitissimo](https://www.habitissimo.es/presupuestos/pintar-piso) (B), [Cronoshare](https://www.cronoshare.com/cuanto-cuesta/pintar-piso) (B).

### Reformista → Reforma integral de vivienda
- **Rango**: 400-600 €/m² (media-baja), 600-1.200 €/m² (media-alta), 800-1.500 €/m² (alta/lujo). Piso 100m²: 50.000-120.000 € total.
- **Factores**: alcance, calidad de acabados, antigüedad del edificio (redes obsoletas, amianto), superficie, ubicación, proyecto/licencia si afecta estructura.
- **Fuentes**: [Habitissimo](https://www.habitissimo.es/presupuestos/reforma-integral-vivienda) (B), [Cronoshare](https://www.cronoshare.com/cuanto-cuesta/reforma-integral) (B), [idealista](https://www.idealista.com/reformas/reformas-de-viviendas/) (B) — tres fuentes convergen. Dato de contexto (no usar como rango principal, mide obra nueva no reforma): índice de costes de edificación del Ministerio de Transportes y coste de construcción de Sociedad de Tasación.
- Pendiente de revisar manualmente: [Informe anual del sector de la reforma en España (Habitissimo)](https://procenter.habitissimo.es/documento/informe-anual-sobre-el-sector-de-la-reforma-en-espana-2022/), que parece tener metodología de encuesta declarada — podría acercarse más a confianza A si se verifica.

## Exterior y mantenimiento

### Carpintero → Instalar un armario a medida
- **Rango**: 250-450 €/ml melamina/laminado, 400-700 €/ml MDF lacado, 600-900 €/ml madera maciza; rural 180-270 €/ml. Armario 2-3m: ~900-3.500 € según material.
- **Factores**: material del frente, acabado interior, medidas no estándar, complejidad del hueco, zona.
- **Fuente**: [Habitissimo](https://precio.habitissimo.es/hacer-armario-a-medida) (B).

### Cerrajero → Cambiar una cerradura
- **Rango**: 80-200 € estándar; 200-500 € seguridad/blindada; 250-400 € alta seguridad; 350-600 € electrónica. Desplazamiento 15-70 €; urgencia +50-150 €.
- **Factores**: tipo (embutida/sobrepuesta), nivel de seguridad, tipo de puerta, urgencia horaria.
- **Fuente**: [Cronoshare](https://www.cronoshare.com/cuanto-cuesta/cerrajero) (B).

### Jardinero → Mantenimiento de jardín
- **Rango**: 15-25 €/h (Habitissimo) a 25-45 €/h (otras fuentes); mensual 120-280 € para 100-200 m². Tareas puntuales: abonado 0,20-2 €/m², desbroce 0,25-5 €/m².
- **Factores**: superficie, frecuencia, tipo de tareas, tipo de vegetación, ciudad.
- **Fuentes**: [Habitissimo](https://www.habitissimo.es/presupuestos/mantener-jardin) (B), [Cronoshare](https://www.cronoshare.com/cuanto-cuesta/mantener-jardin-jardinero) (C-B).

### Limpiador → Limpieza profunda de vivienda
- **Rango**: 3-8 €/m²; piso 100m² ≈300-800 € total (rango amplio). Por hora: 15-45 €/h profunda vs. 10-20 €/h mantenimiento habitual.
- **Factores**: m², nivel de suciedad/estado previo, tras obra o no, ciudad, desinfección incluida.
- **Fuente**: [Habitissimo](https://www.habitissimo.es/presupuestos/limpieza-casa) (B).

### Técnico de persianas → Reparar una persiana
- **Rango**: 40-100 € reparación básica (cinta/cordón/cajón), 100-150 € sustitución de lamas, 50-80 € eje; motor 120-300 € (hasta 500 € con instalación).
- **Factores**: tipo de avería, manual vs. motorizada (duplica coste), acceso/altura, marca del motor.
- **Fuentes**: [Habitissimo](https://www.habitissimo.es/presupuestos/reparar-persianas) (B); fmpersiana.org (aparenta ser federación del sector, pero no se pudo verificar naturaleza ni metodología — tratar como B/C hasta verificación manual).

---

## Recomendación de priorización

Sin un criterio de negocio tuyo (qué servicios te interesan más
comercialmente), propongo priorizar por **facilidad de modelar bien con
pocos factores** y **claridad de la fuente**, no por orden alfabético:

1. **Cambiar un grifo** y **Cambiar una cerradura** — precio casi
   directamente por tipo de producto/servicio, pocos factores, fuentes
   más consistentes entre sí.
2. **Pintar una habitación** / **Pintar una vivienda completa** — modelo
   €/m² simple, ya tienen el patrón de "aire acondicionado" muy
   trasladable (precio base + factores por estado de la pared/nº de
   manos).
3. **Instalar un termo eléctrico**, **Añadir enchufes**, **Instalar
   puntos de luz** — factores moderados, buena consistencia entre
   fuentes.
4. **Alicatar un baño**, **Levantar un tabique**, **Armario a medida** —
   más dispersión entre fuentes, hace falta más cuidado en la banda de
   incertidumbre.
5. **Reforma integral**, **Reformar una habitación**, **Instalar una
   caldera** — rangos muy amplios (dependen mucho del alcance real), son
   los que más se benefician de mantenerse como `solo_solicitud`
   (pedir presupuesto sin calculadora) en vez de forzar un rango.
6. **Jardín**, **Limpieza**, **Persianas** — viables pero con las fuentes
   más débiles del lote; recomendaría estos los últimos.

**No he construido ninguna calculadora todavía.** Dime con cuáles quieres
que empiece (puedo hacer varias en paralelo si me das el visto bueno) y
seguimos el mismo proceso que con aire acondicionado: regla de precio en
`/admin/reglas-precio` con fuentes citadas en `/admin/fuentes`, Wizard,
página de resultado, tests, y solo entonces cambio `availabilityStatus`
a `disponible`.
