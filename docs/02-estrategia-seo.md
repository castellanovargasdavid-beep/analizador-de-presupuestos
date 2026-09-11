# Estrategia SEO — Arquitectura previa a construcción de páginas

## Aviso metodológico

Sin acceso a herramientas de volumen de búsqueda en este entorno (Search
Console, Ahrefs, Semrush). El análisis es cualitativo, basado en qué tipo de
páginas rankean y qué preguntas se hacen los usuarios en los SERPs
investigados vía WebSearch, no en cifras de volumen mensual verificadas.
Recalibrar con datos reales en cuanto se conecte Search Console.

**Hallazgo transversal**: en todos los verticales investigados (reforma de
baño/cocina, aire acondicionado, ventanas, pintura, electricidad, fontanería,
impermeabilización, placas solares), el SERP de "cuánto cuesta X" está
dominado por marketplaces de leads (Cronoshare, Habitissimo) y blogs de
contenido genérico. Casi ninguno ofrece una herramienta interactiva real.
Confirma la tesis de diferenciación: la calculadora es una ventaja real y
defendible, no solo una hipótesis de producto.

## 1. Patrones de keyword/intención (reutilizables al escalar de vertical)

| Patrón | Intención dominante |
|---|---|
| "cuánto cuesta / precio [servicio]" | Información + validación de precio |
| "precio [servicio] m²" | Cálculo |
| "presupuesto [servicio]" | Intención de compra/contratación |
| "cuánto cobra un [profesional]" / tarifa hora | Información + validación |
| "[servicio] + ciudad" | Contratación local |
| "[profesional] cerca de mí" / presupuesto gratis | Contratación (fondo de embudo) |
| "presupuesto abusivo/engañoso [servicio]" | Validación de precio (alta intención, baja competencia de herramienta real) |
| "cómo comparar presupuestos de [servicio]" | Comparación — diferenciador nuclear del producto |
| "qué preguntas hacer antes de contratar [profesional]" | Información pre-contratación |
| "[servicio] + urgente" | Urgencia (no es el usuario objetivo de una calculadora) |

## 2. Clasificación de intenciones

1. Información — educativo, sin urgencia comercial.
2. Cálculo — dimensionamiento (p. ej. frigorías por m²).
3. **Validación de precio** — "¿lo que me cobran es razonable?" — núcleo de
   producto, masivamente desatendido por herramienta real.
4. **Comparación** — "tengo 2-3 presupuestos, ¿cuál elijo?" — núcleo de
   producto (Analizador).
5. Contratación/intención de compra — lead gen (fase 2 de negocio).
6. Urgencia — mal servida por una calculadora, no se diseña para ella.

Prioridad: 3 y 4 combinan demanda real + intención comercial + encaje de
herramienta + ausencia de competencia con producto real.

## 3. Arquitectura de URLs (decisión final)

No se usan `/calculadoras/` ni `/analizar-presupuesto/` como espacios de
nombres de nivel superior en v1: con un solo servicio activo serían
directorios de un único enlace (contenido finísimo). Se reservan para cuando
existan ≥3-4 verticales activos.

Calculadora y analizador son páginas hermanas anidadas bajo el servicio (no
jerarquías paralelas): intención de búsqueda distinta, contenido distinto,
misma familia temática para la señal de agrupación de Google.

```
/                                                     Home
/aire-acondicionado/                                  Hub de categoría
/aire-acondicionado/instalacion/                      MVP: calculadora + contenido
/aire-acondicionado/instalacion/analizar-presupuesto/ Analizador
/aire-acondicionado/mantenimiento/                    Futuro, misma estructura

/resultado/[id]                                       noindex, follow
/comparar/[id]                                        noindex, follow

/precios/aire-acondicionado-instalacion/              Datos agregados propios (noindex hasta masa crítica)
/guias/como-comparar-presupuestos-de-instalacion
/guias/preguntas-antes-de-contratar-instalador-aire-acondicionado
/guias/senales-de-alerta-en-un-presupuesto-de-instalacion
/metodologia/
/sobre-nosotros/
/legal/privacidad, /legal/cookies, /legal/aviso-legal
```

`/provincias/` como hub genérico: descartado explícitamente — es el patrón
de contenido fino que se quiere evitar.

## 4. Ficha de plantilla (campos obligatorios por página indexable)

Keyword/intención · intención del usuario · propuesta de valor · herramienta
disponible · contenido único · CTA · monetización · enlaces internos ·
schema recomendado · generación de datos propios.

Ejemplo aplicado en `/aire-acondicionado/instalacion/` y
`/aire-acondicionado/instalacion/analizar-presupuesto/`: ver conversación de
referencia / commit de este documento. Toda página nueva debe rellenar esta
ficha antes de construirse.

## 5. SEO programático — condición de existencia real

Una página regional ("precio instalar aire acondicionado en Barcelona") NO
se genera sustituyendo el nombre de la ciudad en una plantilla. Se genera
solo si se cumple, de forma verificable en `DataSource`/`Region`, al menos
una condición:

1. Dato propio real y suficiente (≥N `Estimation`/`ComparisonResult` de esa
   región).
2. Diferencial normativo/técnico real (p. ej. ordenanzas municipales sobre
   unidades exteriores visibles — **hipótesis sin verificar, línea de
   investigación futura, no un hecho confirmado hoy**).
3. Diferencial de mercado verificado con fuente citable (no un blog SEO).

Mecanismo técnico: la generación de rutas regionales debe ser una condición
de build (`Region` con `DataSource.reliability_score` sobre umbral Y conteo
mínimo de datos propios), no una decisión manual recurrente.

## 6. Enlazado interno

- Navegación principal mínima mientras haya pocos servicios (no menú con 15
  entradas vacías).
- Breadcrumbs reflejan la jerarquía real de carpetas.
- Toda página de servicio enlaza a su hermana (calculadora↔analizador), 1-2
  guías relevantes y metodología.
- Guías terminan con CTA contextual a la herramienta específica, nunca
  genérico.
- Enlazado entre calculadoras de distintos verticales: solo cuando exista
  relación real de proyecto (ej. reforma de cocina → instalación eléctrica),
  no enlazado ciego entre todas.

## 7. Schema por tipo de página

| Página | Schema |
|---|---|
| Servicio (calculadora) | `Service`, `FAQPage`, `BreadcrumbList` |
| Analizador | `FAQPage`, `BreadcrumbList` (sin `Service`) |
| Guías | `Article`/`HowTo` + `BreadcrumbList` |
| Metodología | `Article` |
| Home | `WebSite` + `Organization` |
| Resultado/Comparar | Ninguno relevante (noindex) |

Nunca `Product`/`Offer` con precio como si fuera fijo — falsearía datos ante
Google y ante el usuario.

## 8. Contenido

El contenido sostiene la confianza de la herramienta (de dónde sale cada
rango, qué lo mueve, qué preguntar), no es "para rankear". Las guías nacen de
hallazgos reales de investigación (señales de alerta encontradas: partidas
agrupadas sin desglose, "primera marca" sin especificar, anticipos
excesivos). Toda pieza nueva debe atacar una intención no cubierta ya por
otra página del sitio. Sin relleno de palabras.

## 9. Indexación

Indexables desde el día 1: `/`, `/aire-acondicionado/`,
`/aire-acondicionado/instalacion/`,
`/aire-acondicionado/instalacion/analizar-presupuesto/`, `/guias/*`,
`/metodologia/`, `/sobre-nosotros/`, `/legal/*`.

Indexables solo cuando haya contenido real que lo justifique:
`/precios/[servicio]/` (datos propios agregados suficientes), páginas
regionales (condición de la sección 5).

## 10. Páginas que NO se indexan

- `/resultado/[id]`, `/comparar/[id]` — noindex, follow.
- Páginas de estado interno (login, cuenta, confirmaciones de lead).
- Páginas regionales que no cumplan el criterio de la sección 5 — no se
  "noindexan", directamente no se generan.
- Parámetros de query/filtros/sesión — noindex + canonical a versión limpia.
