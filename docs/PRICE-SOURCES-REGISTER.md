# Registro de fuentes de precios

Registro único de todas las fuentes usadas o evaluadas para las
calculadoras de Presupuesto Claro, con el detalle exigido por
`docs/CALCULATOR-QUALITY-STANDARD.md`: URL, entidad responsable, fechas,
cobertura geográfica, unidad de medida, qué parte de la fórmula respalda,
y limitaciones. Complementa (no sustituye) la tabla `data_sources` en
Postgres, que es la fuente de verdad operativa que citan los factores de
precio — este documento es legible por humanos y explica el contexto que
una fila de base de datos no puede.

## 0. Aviso crítico — léase antes de citar cualquier cifra de este documento

Este registro se construyó en dos fases:

1. **Investigación previa** (`docs/09-investigacion-precios-multi-servicio.md`):
   agregadores tipo Habitissimo/Cronoshare, con `WebFetch` funcionando
   parcialmente. Esas fuentes ya están sembradas en `data_sources` con
   confianza B y siguen siendo válidas tal como están.
2. **Esta investigación** (3 agentes en paralelo, sesión del
   2026-09-17, buscando fuentes oficiales/técnicas más allá de
   agregadores): **`WebFetch` estuvo bloqueado por el proxy de red hacia
   prácticamente todos los dominios probados** (boe.es, fabricantes,
   distribuidores, bases de precios autonómicas — más de 25 dominios
   distintos entre los tres agentes, prácticamente ninguno accesible).
   Como consecuencia, **todas las fuentes nuevas de este documento
   proceden de fragmentos de resultados de búsqueda (`WebSearch`), no de
   haber leído la página completa**.

**Regla operativa**: ninguna fuente marcada como "no verificado
directamente" en este documento puede citarse en un factor de precio real
(`pricing_factors.sourceId`) hasta que alguien, con acceso normal a
internet (fuera de este entorno), abra la URL y confirme la cifra exacta.
Esto no es una formalidad — es la misma disciplina que ya se aplicó en
`docs/09` para Cronoshare, y por la que este proyecto no inventa datos.

## 1. Fuentes transversales (aplican a varios servicios)

| Fuente | URL | Entidad | Fecha public. | Cobertura | Unidad | Respalda | Estado de verificación |
|---|---|---|---|---|---|---|---|
| VII Convenio Colectivo General del Sector de la Construcción (modificación salarial) | https://www.boe.es/diario_boe/txt.php?id=BOE-A-2025-25234 | Dirección General de Trabajo (Ministerio de Trabajo) / BOE | Resolución 24-nov-2025, BOE 10-dic-2025 | España (marco estatal; **las tablas salariales concretas en €/hora son provinciales**, no hay tabla nacional única) | % de incremento anual sobre tablas provinciales (+3,5% 2025, +3% 2026) | Suelo salarial de referencia de mano de obra (albañil, fontanero, electricista, pintor, alicatador) para TODOS los servicios de reforma/instalación | No verificado directamente (WebFetch bloqueado). Es el convenio MARCO — las cifras reales en €/hora están en convenios provinciales (ver ejemplos Madrid/Barcelona abajo) |
| Tablas salariales construcción, provincia de Madrid 2026 | https://www.bocm.es/boletin/CM_Orden_BOCM/2025/12/31/BOCM-20251231-1.PDF (vía agregadores de nóminas) | Comunidad de Madrid (BOCM) | 31-dic-2025 | Provincia de Madrid | €/día, €/año (Oficial 1ª ≈67,36 €/día, 25.103 €/año; Peón ≈23.052 €/año) | Coste salarial BRUTO de referencia (no tarifa de facturación al cliente) | No verificado directamente. **Importante**: es salario de convenio pagado por un empresario a un empleado, no lo que un autónomo/empresa cobra a un cliente final (eso incluye margen, SS, desplazamiento, IVA — típicamente 2-4× el salario de convenio) |
| Tablas salariales construcción, provincia de Barcelona 2025 | vía https://cartaslaborales.app (cita BOPB) | Generalitat de Catalunya / BOPB | Vigencia 2025-2026 | Provincia de Barcelona | €/día (Peón Ordinario 33,50 €/día base, 74,84 €/día "jornada total" con pluses) | Mismo uso que Madrid, para contraste entre provincias | No verificado directamente, y no confirmado contra el BOPB original (solo vía agregador de nóminas) |
| Reglamento Electrotécnico de Baja Tensión (REBT), RD 842/2002 modificado por RD 298/2021 | https://www.boe.es/biblioteca_juridica/codigos/abrir_pdf.php?fich=326_Reglamento_electrotecnico_para_baja_tension_e_ITC.pdf | Ministerio de Industria y Turismo / BOE | RD 2002, modificación vigente desde 1-jul-2021 | España (estatal) | Normativa técnica (sin precio) | Justifica normativamente por qué "cuadro eléctrico adaptado al REBT vigente" es una variable real de la fórmula (obligatoriedad legal, no elección estética) — usado también para el argumento de tipo de caldera obligatorio (ver §caldera) | No verificado directamente. Es normativa oficial de máximo rango dentro de lo posible — solo falta confirmar el texto exacto |
| RD 919/2006 (Reglamento técnico de distribución y utilización de combustibles gaseosos, ITC-ICG 01-11) | https://www.boe.es/buscar/act.php?id=BOE-A-2006-15345 | Ministerio de Industria / BOE | BOE 4-sept-2006 | España (estatal, desarrollo autonómico) | Normativa técnica (sin precio) | Fundamenta la obligatoriedad legal del boletín de gas al instalar/modificar una caldera | No verificado directamente |
| Base de Datos de Construcción (BDC) del IVE | https://www.five.es/ , https://habitatge.gva.es/es/base-de-precios | Institut Valencià de l'Edificació (organismo público, Generalitat Valenciana) | Actualización periódica ("BDC26" mencionada) | Comunitat Valenciana (usada de facto fuera de la CV también) | €/partida elemental (no €/m² agregado) | Coste de materiales+mano de obra por partida atómica — insumo para construir una fórmula propia, no un precio final ya agregado | No verificado directamente. Consulta puntual aparentemente gratuita; descarga completa (BC3) de pago |
| Base de Precios de la Construcción de la Comunidad de Madrid (BDCCM) | http://www.madrid.org/bdccm/baseprecios/contenido.htm | Comunidad de Madrid (organismo público) | Actualizaciones periódicas | Comunidad de Madrid | €/m² por partida descompuesta (ej. "Tabique 1/2 ladrillo hueco doble") | La fuente más cercana a "organismo público con base de precios de acceso gratuito" localizada en esta investigación | No verificado directamente — hay que confirmar que sigue siendo de consulta libre |
| Generador de precios CYPE (versión web gratuita) | https://generadordeprecios.info/ | CYPE Ingenieros, S.A. (empresa privada) | Actualización continua | España, con variantes por municipio/región | €/partida, con desglose materiales+mano de obra | Insumo de contraste para casi todos los servicios de reforma — pero es una empresa privada de software, no un organismo oficial | No verificado directamente. La versión de escritorio/software completo (Arquímedes) SÍ es de pago; el generador web usado aquí es gratuito sin registro |
| ITEC BEDEC | https://itec.cat | Institut de Tecnologia de la Construcció de Catalunya (fundación público-privada) | Anual | Cataluña (referencia también fuera) | €/partida | Igual función que IVE/CYPE | **Confirmado de pago** — 15 consultas gratis/mes con registro, luego suscripción. No se ha usado ninguna cifra de aquí |
| Bases de precios de Colegios de Aparejadores ("Precio Centro" y similares) | https://preciocentro.com/ | Colegios Oficiales de Aparejadores y Arquitectos Técnicos (varios, provinciales) | Ediciones anuales | Provincial | €/partida (formato FIE-BC3) | Referencia pericial de coste de ejecución | **Confirmado mayoritariamente de pago** (con descuento para colegiados). No se ha usado ninguna cifra de aquí |

## 2. Fuentes por servicio — las 11 calculadoras activas

Para cada servicio: la fuente de mercado ya sembrada (`docs/09`, sin
repetir aquí) sigue siendo la base actual de `data_sources`. Lo que sigue
es lo nuevo encontrado en esta investigación, sin verificar todavía.

### Cambiar un grifo
- **Roca — Tarifa PVP 2025/2026** (https://www.roca.es/productos/descargas): fabricante líder de sanitarios español, tarifa anual con PVP por referencia. No verificado directamente; el PVP de fabricante suele ser superior al precio real de compra con descuento de distribuidor.
- **CYPE — partida "Grifería monomando, para lavabo"**: cita un modelo real (GROHE BauEdge, 131,07 €) dentro de un descompuesto con mano de obra de fontanero integrada. No verificado; es precio de "unidad de obra" con gastos generales de contratista, no necesariamente el precio de un fontanero autónomo.
- **Evaluación**: el mejor respaldado de los 18 servicios en fuentes de fabricante. Para subir de nivel de fuente (no de confianza, que sigue exigiendo validación empírica) haría falta confirmar el PVP de 2-3 fabricantes y separar explícitamente material (grifo) de mano de obra (horas × tarifa de convenio provincial).

### Cambiar una cerradura
- **CVL, vía distribuidores mayoristas** (AFT Grupo, Ferretea): cilindros 42-52 €, cerraduras de embutir desde 37,59 €. Sin fecha de vigencia verificable, precio de distribuidor no de fabricante directo.
- **TESA ASSA ABLOY** — catálogo técnico existe, sin precio confirmado (los fabricantes de seguridad no suelen publicar PVP, a diferencia de sanitarios).
- **Evaluación**: el peor respaldado de los primeros 6 — sigue dependiendo esencialmente de agregadores para el conjunto mano de obra + urgencia + niveles de seguridad.

### Pintar una habitación / Pintar una vivienda completa
- **Titan (Titanlux)**: rendimiento por línea de producto, 3-12 m²/litro según gama — variación grande, hay que fijar y documentar qué línea se usa como referencia.
- **Bruguer/AkzoNobel**: rendimiento similar (8-12 m²/l), no verificado en la web del fabricante directamente (solo vía retailers).
- **CYPE — partida RIP030** ("Pintura plástica sobre paramento interior"): 6,92-7,77 €/m² con mano de obra incluida, según soporte.
- **Evaluación**: base técnica razonable para el material (rendimiento), débil para separar limpiamente mano de obra de material — sigue mezclando ambos en el €/m² de agregadores/CYPE.

### Añadir enchufes
- **CYPE — "Base de toma de corriente empotrada"**: 15,28 € (obra nueva) / 11,73 € (rehabilitación) / 11,26 € (Murcia), con nota explícita de que no incluye la caja de empotrar.
- **CYPE — cable eléctrico (H07V-K, RV-K)**: 0,90-1,41 €/metro según sección, sin confirmar si incluye mano de obra de tendido.
- **Legrand/Niessen-ABB/Simon**: tarifas PVP existen pero ninguna accesible sin registro o pago en esta sesión.
- **Evaluación**: segundo mejor respaldado — el mecanismo tiene precio de gama básica confirmado por CYPE, falta la gama de marca.

### Instalar puntos de luz
- **CYPE — "Interruptor empotrado"**: 11,78-15,40 € según obra nueva/rehabilitación, pero es solo el interruptor, no el "punto de luz" completo (falta cable + caja + portalámparas).
- **Evaluación**: el más incompleto de los primeros 6 en fuentes propias — sigue dependiendo de agregadores para un precio "todo incluido" por punto.

### Instalar un termo eléctrico
- **Cointra, Junkers/Bosch, Fleck**: los tres publican tarifas de fabricante reales y localizables, pero las versiones encontradas están desactualizadas (2022-2024), ninguna confirmada como la vigente 2026.
- **Leroy Merlin — servicio de instalación**: tarifa real de mano de obra publicada (incluye qué cubre: conexión hasta 50cm/1m; opcionales con precio: válvula reductora 63€, llaves de escuadra 35€), precio base no confirmado en el fragmento.
- **Evaluación**: el mejor respaldado en fuentes de fabricante de todo el catálogo — con tarifas vigentes confirmadas, este sería el candidato más claro para una fuente `catalogo_real` real.

### Reparar una fuga
- **Sin fuente mejor que agregador para materiales** — servicio demasiado heterogéneo (junta, tramo de tubo, latiguillo) para tener catálogo propio.
- **Convenio de fontanero/albañil** (§1) como suelo salarial de mano de obra.
- **Evaluación**: el peor respaldado de los 11 activos — se mantiene esencialmente en agregadores.

### Alicatar un baño
- **Leroy Merlin — "servicio de cambio de azulejos/cerámica"**: tarifa real publicada, 30,50 €/m² base (mínimo 10 m²) + incrementos por formato/patrón documentados (rectificado +4,50€/m², gran formato +8€/m², cenefa/gresite +13€/m²).
- **Porcelanosa** — documento "Tarifa Baths" localizado pero no confirmado; **Saloni** — solo precios de reventa, no tarifa de fabricante propia.
- **Evaluación**: la mejor tarifa de mano de obra real de todo el catálogo (estructurada, con incrementos explícitos) — el material sigue sin fuente de fabricante confirmada.

### Levantar un tabique
- **BDCCM de Madrid** (§1) — la única fuente de organismo público con base de precios para este servicio.
- **Pladur, Placo (Saint-Gobain)** — tarifas de fabricante reales pero desactualizadas (2022-2023).
- **Knauf** — solo vía CYPE (empresa privada), no tarifa propia.
- **Evaluación**: el único de los 11 con un indicio de fuente de organismo público con precios reales — pendiente de confirmar acceso y vigencia.

### Instalar un armario a medida
- **Leroy Merlin — servicio de instalación**: tarifa real y estructurada, 120 €/ml base (mínimo 1 ml) + 36,50 €/ml por puertas/herrajes, servicio de medición 40€ descontable.
- **Egger, Finsa** (fabricantes de tablero): **fracaso de esta investigación** — ninguno publica precio accesible sin ser distribuidor.
- **Evaluación**: mano de obra mejor documentada del catálogo; material sin respaldo mejor que agregador.

## 3. Fuentes por servicio — los 6 con más potencial de reformar_habitacion..cuadro (grupo 2 de la investigación)

### Cambiar el cuadro eléctrico
- **REBT + ITC-BT-17 + ITC-BT-25 + RD 298/2021** (§1): el conjunto normativo más sólido de todo el catálogo — fija con certeza legal (no de mercado) el nº mínimo de circuitos por grado de electrificación y la obligatoriedad de ciertos componentes.
- **Tarifas EICI 2026 de la Comunidad de Madrid** (https://www.comunidad.madrid/docs/assets/2026/04/08/tarifas_2026_bt.pdf): organismo público, PDF fechado (8-abr-2026), tasa real de tramitación/inspección — **la fuente más sólida encontrada para el coste administrativo del boletín eléctrico**, pendiente de confirmar el importe exacto.
- **Schneider Electric, ABB**: tarifas de fabricante existen, precios de ejemplo (PIA ~28-32€, diferencial ~76-91€) proceden de distribuidores citándolas, no de las tarifas mismas.
- **Evaluación**: el servicio con más margen para subir de nivel de fuente de todo el catálogo, gracias a la combinación de normativa dura + una tasa administrativa oficial fechada.

### Instalar una caldera (actualmente `solo_solicitud`)
- **RITE + RD 919/2006** (§1): fija normativamente que el equipo debe ser de condensación/bajo NOx en la mayoría de casos, y que el boletín de gas es obligatorio.
- **Certicalia/Cronoshare/Habitissimo** — coste del boletín de gas: 90-150€ vivienda unifamiliar, ~200€ comunidad (agregadores, confianza B).
- **Saunier Duval y otros fabricantes**: precios de distribuidor (1.700-3.500€ instalación básica-microacumulación), no tarifa de fabricante directa confirmada.
- **Evaluación**: el más cercano a poder subir de estado de los `solo_solicitud` — normativa dura + coste de boletín razonablemente consistente entre fuentes. Recomendación de la investigación: **candidato a revisar como calculadora B reforzada en una futura iteración**, no en esta.

### Reforma integral de vivienda (actualmente `solo_solicitud`)
- **Habitissimo — informe anual del sector**: metodología declarada (encuesta a profesionales+particulares), pero solo da una inversión media agregada (~60.000€), no un €/m² desglosado por acabados.
- **idealista — sección reformas**: rangos de mercado (400-1.500€/m²) sin metodología publicada.
- **Evaluación de la investigación (coincide con `docs/09`)**: **no viable como fórmula honesta**, ni siquiera en B estrecha — la dispersión de acabados es real e independientemente confirmada por 3 fuentes que convergen en orden de magnitud pero no en cifra. Permanece en `solo_solicitud`.

### Reformar una habitación (actualmente `solo_solicitud`)
- Las bases públicas (IVE, CYPE, BDCCM) dan precio por partida elemental, no por "reforma de habitación" agregada — reconstruir esa cifra exigiría asumir una mezcla de partidas tan subjetiva como un agregador.
- **Evaluación**: permanece en `solo_solicitud`, salvo que se descomponga en sub-tareas ya atómicas (alicatar, tabique...) que sí son viables.

### Mantenimiento de jardín (actualmente `solo_solicitud`)
- **Convenio colectivo estatal de jardinería 2025-2030** (https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-2227): **hallazgo nuevo real** — a diferencia de otros oficios, jardinería SÍ tiene un convenio estatal único (no fragmentado por provincia) con tabla salarial propia: Jardinero/a 1.277,77€/mes, Oficial 1.344,13€/mes, Peón 1.184,00€/mes (cifras 2025).
- **Evaluación**: el convenio da un suelo salarial oficial verificable por categoría — sube el nivel de fuente sobre lo que había en `docs/09` (solo agregadores, 25-45€/h). **Candidato razonable a subir de `solo_solicitud` a una calculadora B** en una futura iteración (m² × frecuencia × tipo de tarea), no en esta.

### Limpieza profunda de vivienda (actualmente `solo_solicitud`)
- **Convenio de limpieza de edificios y locales**: a diferencia de jardinería, **no tiene tabla salarial estatal única** — son convenios provinciales/autonómicos distintos (Madrid, Cataluña, Valencia, Zaragoza...) con salario base "Limpiador/a" entre ~1.010€/mes y ~1.260€/mes según provincia.
- **Evaluación**: viable en B con más trabajo de base que jardinería (habría que aplicar el convenio provincial correspondiente a la zona del usuario). Sigue en `solo_solicitud` por ahora.

### Reparar una persiana (actualmente `solo_solicitud`)
- **Somfy — tienda oficial**: precio de fabricante real para motores tubulares (Motor RTS MRR 10Nm ≈259€, 30Nm ≈279€) — precio de venta al público, no tarifa mayorista, pero es un dato de fabricante verificable.
- **Evaluación**: de los 6 servicios `solo_solicitud`, el más fácil de modelar con pocos factores discretos (tipo de avería × manual/motorizada) gracias a este precio de componente — coincide con la evaluación de `docs/09`. **Candidato razonable a calculadora B** en una futura iteración.

## 4. Fuentes descartadas explícitamente por ser de pago

Por la regla de `CALCULATOR-QUALITY-STANDARD.md` §6: existen, se
documentan, no se usa ninguna cifra suya sin contratarlas.

- **CYPE Arquímedes / generador de precios de escritorio** (distinto de la versión web gratuita usada arriba).
- **ITEC BEDEC** (Cataluña) — 15 consultas gratis/mes con registro, luego suscripción.
- **IVE / BDC de la Comunitat Valenciana** — consulta puntual gratuita, descarga completa (BC3) de pago.
- **Bases de precios de Colegios de Aparejadores** ("Precio Centro" y equivalentes provinciales) — de pago con descuento para colegiados.

## 5. Próximos pasos de verificación (antes de tocar ninguna `pricing_rule` con esto)

1. Abrir manualmente (navegador normal, no este entorno) las URLs marcadas
   como "no verificado directamente" que tengan mayor impacto potencial:
   tarifas EICI 2026 de Madrid (boletín eléctrico), tarifa vigente de
   Cointra/Junkers/Fleck (termo), BDCCM de Madrid (tabique), Roca (grifo).
2. Confirmar que las cifras del fragmento de búsqueda coinciden con el
   contenido real de la página.
3. Solo entonces, dar de alta la fuente en `data_sources` con
   `sourceType` correcto (`oficial` para normativa BOE/REBT/RITE,
   `catalogo_real` para tarifas de fabricante confirmadas,
   `mercado` para lo demás) y actualizar los factores afectados.
4. Ninguno de estos cambios, por sí solo, sube ningún servicio a
   confianza A — solo mejora la clase de fuente citada, que es el
   criterio B4/B5 de `CALCULATOR-QUALITY-STANDARD.md`, no el A1-A4 que
   exige validación empírica real.
