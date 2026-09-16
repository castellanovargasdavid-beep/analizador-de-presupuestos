# Presupuesto Claro

Calculadora orientativa de precios para servicios del hogar en España.
Empieza por instalación de aire acondicionado (Madrid como zona inicial de
validación comercial). Ayuda a un particular a: (1) calcular un rango de
precio razonable, (2) comparar un presupuesto real recibido contra ese
rango, y (3) pedir presupuestos a profesionales, de forma honesta y sin
prometer nada que el producto todavía no puede cumplir.

Distinción explícita que se mantiene en todo el producto:

- **Estimación orientativa** — un rango calculado, no un precio cerrado.
- **Solicitud de presupuesto** — un usuario ha pedido que le contacten.
- **Lead cualificado** — una solicitud que un administrador ha validado
  como real y útil (ver `docs/MVP-COMPLETION-AUDIT.md`, modelo de estados).
- **Cliente contratado** — algo que este producto no mide ni promete todavía.

## Arquitectura

- **Next.js 16 (App Router, Turbopack) + React 19 + TypeScript estricto.**
- **Tailwind CSS v4** — tokens de diseño en `app/globals.css` (`@theme`), sin `tailwind.config.js`.
- **Drizzle ORM + PostgreSQL** (`db/schema.ts`, `db/migrations/`) — Postgres real en local, Neon en producción.
- **Cero contenido comercial hardcodeado**: precios, factores, guías SEO, preguntas y FAQs viven en la base de
  datos y se gestionan desde `/admin`, no en el código. Varias páginas públicas usan `generateStaticParams` y
  consultan la base de datos **en tiempo de build**: `next build` necesita un `DATABASE_URL` alcanzable.
- **Iconos**: SVG inline en `components/ui/icons.tsx`, sin librería externa ni dependencia de red.
- **Analítica propia** (`lib/analytics`): sin cookies de terceros, `sessionId` solo en `sessionStorage`.

Documentos de arquitectura más detallados en `docs/00-arquitectura-producto.md` a `docs/08-arquitectura-administrativa.md`.

## Instalación local

Requisitos: Node.js 20+, PostgreSQL 16 accesible localmente.

```bash
npm install
cp .env.example .env.local
```

Edita `.env.local`:

```
DATABASE_URL="postgres://postgres:postgres@localhost:5432/presupuesto_claro"
ADMIN_PASSWORD="elige-una-contraseña"
ADMIN_SESSION_SECRET="$(openssl rand -hex 32)"
```

Crea la base de datos vacía y aplica las migraciones:

```bash
createdb presupuesto_claro   # o el comando equivalente de tu instalación de Postgres
npm run db:migrate
npm run db:seed              # datos de precio/contenido de partida (professionals queda vacía a propósito)
```

## Comandos de desarrollo

```bash
npm run dev             # servidor de desarrollo (Turbopack)
npm run build            # build de producción — requiere DATABASE_URL alcanzable
npm run start             # sirve el build de producción
npm run db:generate      # genera una migración a partir de cambios en db/schema.ts
npm run db:migrate        # aplica las migraciones pendientes
npm run db:push           # (solo prototipado local) empuja el esquema sin generar migración
npm run db:seed           # datos iniciales de precio y contenido
```

## Comandos de pruebas

```bash
npx tsc --noEmit    # TypeScript estricto
npx eslint .         # lint
npx vitest run        # tests unitarios + de integración (los de integración se saltan sin DATABASE_URL)
npm run build          # build de producción como comprobación final
```

## Panel de administración

`/admin/login` (sin enlace público visible — es deliberado). Un único
operador, contraseña compartida por variable de entorno + cookie de sesión
firmada (`lib/admin/auth.ts`) — sin sistema de usuarios/roles todavía. Todas
las rutas bajo `/admin/**` (salvo `/admin/login`) están protegidas en el
servidor por `proxy.ts` (antes `middleware.ts`), no solo por controles
visuales del cliente.

Secciones: catálogo (categorías/servicios/materiales), geografía
(regiones/provincias/ciudades), precios (fuentes/reglas/IVA/incertidumbre),
contenido SEO (guías/preguntas/FAQs), y negocio (**leads**, **profesionales**,
explicador de estimaciones).

## Flujo de leads y modelo de estados

Ver el detalle completo, con matriz de funcionalidades y estado real de
cada área, en **`docs/MVP-COMPLETION-AUDIT.md`**.

Resumen del ciclo de vida de un lead (`leads.status`, ver `db/schema.ts`):

`nuevo` → `validado` → `asignado` → `enviado` → `contactado` → `cerrado`,
con dos salidas honestas en cualquier punto: `sin_cobertura` (no hay
profesional verificado para ese servicio/zona — se asigna automáticamente,
nunca a mano) y `descartado`/`con_incidencia` (decisión o problema
gestionado a mano por un administrador, con motivo registrado).

Todo el emparejamiento con un profesional es manual (`/admin/leads`,
`/admin/profesionales`): no existe todavía ningún algoritmo de matching ni
notificación automática al profesional.

## Limitaciones conocidas

- **Sin red de profesionales real todavía**: `professionals` empieza vacía
  a propósito. Un lead queda en `sin_cobertura` hasta que haya alguien
  verificado en su servicio/zona.
- **Sin pagos automáticos**: el cobro a un profesional por un lead se
  registra a mano (`leads.paymentStatus/paymentAmount`), sin pasarela de
  pago.
- **Sin portal para profesionales**: toda su gestión es interna, desde
  `/admin/profesionales`.
- **Un único operador admin**: sin roles ni usuarios múltiples.
- **Textos legales marcados como borrador**: pendientes de revisión legal
  formal (ver `/legal/*`).

## Procedimiento de recuperación ante errores

- **Migración fallida a mitad**: las migraciones de Drizzle son
  transaccionales por archivo; revisa `db/migrations/meta/_journal.json`
  contra el estado real de `drizzle.__drizzle_migrations` antes de
  reintentar. No edites una migración ya aplicada en producción — crea una
  migración nueva que corrija el estado.
- **Build de producción falla por `DATABASE_URL`**: es el comportamiento
  esperado, no un bug — el build necesita leer contenido/precios reales
  desde Postgres. Verifica que la cadena de conexión sea la del *pooler*
  si usas Neon.
- **Lead atascado en un estado incorrecto**: se gestiona a mano desde
  `/admin/leads` — cada transición queda registrada en `admin_audit_log`
  con quién y cuándo (ver `lib/admin/audit.ts`).
