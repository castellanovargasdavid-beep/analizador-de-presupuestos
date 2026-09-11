# Investigación de precios — Aire acondicionado / Instalación (España)

## Aviso metodológico

WebFetch está bloqueado a nivel de entorno para todos los dominios probados
(incluidos boe.es y es.wikipedia.org), no solo para los sitios de precios.
Toda la investigación se ha hecho con WebSearch (snippets indexados), afinando
las consultas para que el propio snippet devuelva cifras exactas. Esto da
buena confianza por triangulación entre fuentes, pero **no equivale a leer la
fuente primaria completa**. Antes de congelar cualquier cifra en el seed de
producción, debe hacerse una verificación manual puntual (abrir la URL,
confirmar el número).

Clasificación de fiabilidad usada: **A** = fuente externa verificable
(normativa oficial, precio de catálogo real, constante física). **B** =
fuente de mercado sin metodología pública robusta. **C** = heurística de
sector sin respaldo normativo.

## Tabla de fuentes

| Fuente | URL | Qué aporta | Fiabilidad | Uso previsto |
|---|---|---|---|---|
| IDAE — Guía técnica instalaciones con equipos autónomos | idae.es | Requisitos técnicos/normativos RITE | A (normativa, no precio) | Contenido de `/metodologia`, no `PriceFactor` |
| RD 1027/2007 + RD 178/2021 (RITE) | boe.es / afec.es (texto consolidado) | Umbral de potencia: <5kW sin documentación; 5-70kW memoria técnica sustituye proyecto; >70kW proyecto obligatorio. Registro ante la CCAA al poner en servicio, con excepción para sustitución de equipo de potencia igual o menor (≤25% variación, ≤70kW) | A | Regla legal en el motor (afecta si se requiere instalador certificado/registro); texto literal pendiente de copiar de fuente primaria antes de publicarlo |
| AFEC — Informe de Mercado HVAC España 2025 | afec.es | Volumen de mercado, tendencias (no precios al consumidor) | A (como dato de mercado, no de precio) | Contexto/validación de tendencias, no `PriceFactor` |
| OCU | ocu.org | Split 3,5kW equipo+instalación ~2.650€ (gama eficiente); instalación sola "no complicada" ~300€ | B (independiente, pero dato puntual sin muestra declarada) | Cota de contraste, no fuente única |
| Habitissimo — Guía de precios | habitissimo.es | Split con preinstalación ~1.500€ medio; preinstalación ~300€; conductos con preinstalación 1.700-4.000€; media general 2.300€ (rango 800-5.000€) | B (metodología parcial: "datos reales contrastados por expertos", sin muestra ni fecha de corte) | Rango de contraste |
| Cronoshare — "Cuánto cuesta" (nacional + 6 ciudades) | cronoshare.com | Rangos por tipología y única señal de variación por ciudad (Madrid/Barcelona algo más caro) | C-B (sin metodología pública) | Única señal (débil) para justificar un multiplicador regional amplio, no una tabla precisa |
| Leroy Merlin — catálogo de servicios | leroymerlin.es | Precio real de catálogo: base split hasta 4000 BTU 210-249€ (discrepancia sin resolver entre snippets); línea frigorífica extra 29€/m; línea eléctrica interconexión 6€/m; acometida 7,50€/m; desagüe 10€/m; bomba condensados 160€; retirada equipo desde 90€; visita previa 40€ (descontable) | A (precio real transaccional), pendiente de resolver la discrepancia 210 vs 249€ | Base de varios `PriceFactor` de partidas incrementales |
| Retailer de material (línea adicional) | tiendadeaireacondicionado.com | Confirma 20-40€/m para línea frigorífica adicional, convergente con Leroy Merlin | A/B | Refuerza el factor de metros de línea |
| Blogs SEO genéricos (grupoaplus, hogarconfort, climajobs, etc.) | varios | Rangos generales coincidentes en orden de magnitud | C explícita — no citable como `DataSource`, solo señal de consenso |
| Conversión kW ↔ frigorías (1kW ≈ 860 fg) | constante física | Conversión de unidades | A | Utilidad de conversión en el formulario |
| Regla "100 frigorías/m²" (130 si mucho vidrio/orientación sur) | consenso de sector | Dimensionamiento aproximado | C, declarada como heurística en la UI | Ayuda opcional, nunca dato objetivo |

## Discrepancias detectadas

- Split estándar instalado: OCU (~2.650€, equipo de gama eficiente) vs.
  agregadores (850-1.500€, gama media genérica) — la diferencia es la
  variable "gama del equipo", no un error de una fuente. Confirma que
  "gama" debe ser un input del modelo.
- Mano de obra por ciudad: solo Cronoshare aporta señal, sin metodología
  pública — insuficiente para tabla por provincia, suficiente para un
  multiplicador regional amplio y marcado como impreciso.
- Desmontaje de equipo antiguo: 70-300€ (para desechar) vs. 200-1.500€ (para
  reutilizar en otra ubicación) — son dos casos distintos, no un rango único.

## Variables incluidas en el modelo v1 (con evidencia suficiente)

1. Tipo de sistema (split 1x1 / multisplit / conductos) — A/B
2. Potencia (kW/frigorías; conversión física A, regla de dimensionamiento por
   m² como heurística opcional C)
3. Umbral RITE >5kW (afecta certificación/registro requerido) — A, pendiente
   de cita literal verificada
4. Metros de línea frigorífica incluidos vs. adicionales — A/B
5. Gama del equipo (económica/media/premium, no marca específica) — B/C
6. Retirada de equipo antiguo (desechar vs. reutilizar, como casos distintos) — B
7. Trabajos adicionales opcionales (canaleta, desagüe extra) — B (precios de
   catálogo real)
8. Instalación eléctrica dedicada necesaria — A (requisito real) + C (importe)
9. Región a nivel CCAA, como multiplicador amplio con incertidumbre explícita — C

## Variables excluidas de v1 (evidencia insuficiente — no se inventan)

- Multiplicador numérico preciso por dificultad de acceso/altura (solo hay
  menciones cualitativas +150-400€ sin consenso ni fuente robusta) → se
  trata como aviso cualitativo, no como número en el cálculo.
- Marca específica de fabricante → sustituida por "gama".
- Estacionalidad/urgencia → sin fuente encontrada con datos concretos para
  España; queda como línea de investigación futura.
- Precisión geográfica a nivel provincia/ciudad → solo 6 ciudades con señal
  débil de Cronoshare; insuficiente para tabla nacional de provincias.

## Pendiente antes de congelar el seed de producción

- Confirmar manualmente el precio base exacto de Leroy Merlin (210 vs 249€)
  y si corresponde a tramos distintos.
- Copiar el texto literal del artículo/instrucción técnica del RITE que fija
  el umbral de 5kW, leyendo la fuente primaria (BOE o texto consolidado de
  AFEC) directamente, no por snippet.
