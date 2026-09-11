# Arquitectura de producto — Analizador de Presupuestos

## Concepto

Plataforma para el mercado español que responde a: "¿este presupuesto que me han
dado es razonable o me están cobrando de más?". No es un blog con una
calculadora de adorno: la arquitectura es SEO → página específica →
herramienta → resultado → acción comercial, nunca SEO → artículo → fin.

Nunca se afirma que un precio es "correcto" de forma absoluta. Siempre se usa
lenguaje de rango: "estimación orientativa", "rango habitual", "por
encima/debajo del rango estimado". La plataforma no es una tasación
profesional.

## Decisiones definitivas (aprobadas)

1. Primer vertical exclusivo: **aire acondicionado → instalación**. No se
   desarrollan reformas de baño/cocina hasta demostrar este vertical de
   extremo a extremo.
2. `/resultado/[id]` y `/comparar/[id]` son **noindex, follow**.
3. Motor de estimación v1: **sistema de reglas transparente y auditable**.
   Sin ML en v1 (no hay datos propios todavía; un modelo entrenado sería
   inventar datos con pasos extra).
4. Stack: Next.js (App Router) + TypeScript + React + Tailwind, **Drizzle +
   PostgreSQL**, Vitest + Playwright + ESLint, TypeScript estricto.
5. La arquitectura debe permitir añadir servicios nuevos (reformas de baño y
   cocina, ventanas, pintura, electricidad, fontanería, impermeabilización,
   placas solares, mudanzas, limpieza, carpintería, cerrajería, aislamiento,
   calefacción...) sin rehacer el sistema.

## Principio de datos

Todo dato de precio se clasifica como:

- **A. Fuente externa verificable** (normativa oficial, precio de catálogo
  real de un actor de mercado, constante física).
- **B. Fuente de mercado sin metodología pública robusta** (agregadores tipo
  Cronoshare/Habitissimo, artículos de prensa/consumo).
- **C. Suposición/heurística** (reglas de sector ampliamente usadas pero sin
  respaldo normativo, p. ej. "100 frigorías/m²").

Ningún dato se presenta como objetivo si no tiene una fuente suficientemente
fiable. Ver `docs/01-investigacion-precios-aire-acondicionado.md` para el
detalle por fuente.

## Modelo de datos (entidades núcleo)

```
ServiceCategory, ServiceQuestion, PriceFactor, LineItem, Region, DataSource
Estimation, UserBudget, UserBudgetLineItem, ComparisonResult
Lead (fase 2), Professional (fase 3), User, GuidePage
```

`Estimation` lleva `methodology_version`: cuando cambien las reglas de
precio, las estimaciones antiguas siguen siendo reproducibles y auditables.
`PriceFactor` y `Region.cost_index_multiplier` citan siempre un `DataSource`.

## Roadmap de fases

1. Investigación y documentación de fuentes de precios — **hecho** (ver doc 01)
2. Setup técnico
3. Base de datos
4. Motor de estimación
5. Calculadora
6. Analizador de presupuestos
7. Resultado y UX
8. SEO técnico — arquitectura ya definida (ver doc 02), implementación pendiente
9. Contenido
10. Analytics
11. Testing
12. Auditoría completa

Cada fase termina con auditoría: build limpio, tests pasando, lint sin
errores, verificación manual de SEO técnico y navegación responsive.

## Monetización (secuenciada)

- Fase 1 (0-6 meses): sin monetización agresiva. Como mucho, lead gen suave
  y curado manualmente (2-3 profesionales de confianza).
- Fase 2 (6-12 meses): lead gen estructurado, diferenciado por llegar
  cualificado (el usuario ya conoce su rango y ha comparado presupuestos).
- Fase 3 (12+ meses): datos propios como producto (informes, API B2B),
  posible capa premium para el consumidor.
- Publicidad solo en páginas de contenido editorial, nunca dentro del flujo
  de la herramienta. Afiliación solo donde tenga sentido real.
