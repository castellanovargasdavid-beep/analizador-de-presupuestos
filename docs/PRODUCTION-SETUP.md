# Puesta en producción de la plataforma de leads

Qué hay que configurar de verdad para que el sistema descrito en
`docs/REAL-LEAD-PLATFORM-PLAN.md` funcione en producción, más allá de lo
que ya funciona en local. Ver también `docs/07-produccion.md` (seguridad y
privacidad generales del sitio, de una fase anterior) — este documento es
específico de la automatización de leads.

## 1. Variables de entorno nuevas

Además de las ya existentes (`DATABASE_URL`, `ADMIN_PASSWORD`,
`ADMIN_SESSION_SECRET`), añadidas en `.env.example`:

| Variable | Obligatoria en prod | Qué hace si falta |
|---|---|---|
| `PROFESSIONAL_SESSION_SECRET` | Sí | El portal de profesional no arranca — `lib/professional/auth.ts` lanza un error explícito en cuanto se intenta crear/verificar una sesión. Genera un valor propio, **distinto** del de admin (`openssl rand -hex 32`). |
| `CRON_SECRET` | Sí (si se usa el cron) | `/api/cron/lead-deadlines` rechaza toda petición (401) sin `Authorization: Bearer <valor>` que coincida. Sin esto configurado, el cron nunca hace nada — no hay un modo "abierto" inseguro. |
| `NOTIFICATION_ADAPTER` | No (por defecto `mock`) | Mientras no se ponga a un adaptador real, ninguna notificación sale de verdad — ver `docs/NOTIFICATION-SYSTEM.md`. |
| 8 variables `*_HOURS` de plazos | No | Usan los valores por defecto de `lib/leads/deadline-config.ts` si no se definen. |

## 2. Cron de plazos en Vercel

`vercel.json` declara:

```json
{ "crons": [{ "path": "/api/cron/lead-deadlines", "schedule": "0 6 * * *" }] }
```

**Limitación real del plan Hobby de Vercel**: solo permite ejecutar un cron
como máximo una vez al día — un `*/15 * * * *` (cada 15 minutos, el
diseño original de este documento) hace que Vercel **rechace el
despliegue** con el error "Hobby accounts are limited to daily cron
jobs". Por eso el schedule por defecto es diario (`0 6 * * *`, las 6:00
UTC). Consecuencia práctica de este ajuste: los avisos de "plazo
próximo" (`CONTACT_WARNING_DELAY_HOURS`/`QUOTE_WARNING_DELAY_HOURS`,
pensados para dispararse 1-12h antes del vencimiento) y las reasignaciones
por incumplimiento solo se procesan **una vez al día**, no cada 15
minutos — un lead puede tardar hasta ~24h más de lo que sugiere
`docs/REASSIGNMENT-POLICY.md` en ser avisado o reasignado. Si esto no es
aceptable operativamente, la solución es pasar el proyecto a un plan de
Vercel que permita crons más frecuentes y volver a poner
`*/15 * * * *` (o el intervalo que se decida) en `vercel.json`.

Pasos para que funcione de verdad en producción:

1. Confirmar que el proyecto está desplegado en Vercel (Vercel Cron solo
   funciona ahí, no en otros hosts — si se despliega en otro sitio, hay
   que configurar un cron de sistema o un servicio externo que llame al
   mismo endpoint con la misma cabecera).
2. Definir `CRON_SECRET` en las variables de entorno del proyecto en
   Vercel.
3. Vercel añade automáticamente la cabecera
   `Authorization: Bearer <CRON_SECRET>` a las llamadas que él mismo
   dispara — no hace falta configurar nada más en `vercel.json` para eso.
4. Verificar tras el primer despliegue: `/admin/automatizaciones` debe
   empezar a mostrar una ejecución diaria. Si no aparece ninguna,
   revisar los logs de Vercel Cron (Project → Cron Jobs) antes de asumir
   que el código falla.
5. **Sin este paso, el sistema es técnicamente correcto pero no
   operativo**: los leads se asignan igual (la asignación inicial no
   depende del cron), pero nunca se avisará de un plazo próximo ni se
   reasignará nada por incumplimiento hasta que alguien invoque el
   endpoint a mano.

## 3. Notificaciones reales

Ver `docs/NOTIFICATION-SYSTEM.md` para el cómo. Aquí, el qué hace falta
decidir antes:

- Elegir proveedor de email transaccional (ninguno integrado hoy).
- Decidir si se necesita SMS/WhatsApp para profesionales sin email
  fiable — no hay ningún adaptador de referencia para esos canales
  todavía, solo la interfaz genérica.
- Verificar el dominio de envío (SPF/DKIM) para no acabar en spam — esto
  es responsabilidad del proveedor elegido, no de este código.

## 4. Migración de base de datos

La migración `0009` (máquina de estados ampliada, exclusividad,
notificaciones, cron) es **puramente aditiva**: nuevos tipos, nuevas
columnas nullable/con default, nuevas tablas. No borra ni recodifica
ningún dato existente. Aun así, en Neon (o cualquier Postgres gestionado
sin acceso a `drizzle-kit migrate` desde este entorno), aplícala con el
mismo método ya usado para `0007`/`0008`:

1. Generar/confirmar el SQL consolidado (`db/migrations/0009_*.sql`).
2. Aplicarlo primero contra una copia o rama de la base de producción si
   es posible.
3. Ejecutar el SQL vía el editor de la consola del proveedor.
4. Verificar con una consulta simple (`SELECT 1 FROM lead_status_history LIMIT 1;`, `SELECT 1 FROM notifications LIMIT 1;`) que las tablas nuevas existen antes de desplegar el código que las usa.

**Nunca despliegues el código de esta fase sin haber aplicado antes la
migración `0009`** — el build de Next.js no falla por esto (no hay
comprobación de esquema en build time), pero cualquier lead nuevo fallaría
en tiempo de ejecución al intentar leer/escribir columnas que no existen
todavía (el mismo tipo de incidente que ya ocurrió con `0007`/`0008` en
esta misma aplicación).

## 5. Qué hace falta además de configuración técnica

Repetido aquí porque es la parte que más fácil es dar por hecha:

- **Profesionales reales verificados** (`docs/PROFESSIONAL-ONBOARDING.md`)
  — sin esto, todo lead nuevo acaba en `sin_cobertura`.
- **Zonas y servicios de cobertura reales** cargados para esos
  profesionales.
- **Consentimiento y textos legales revisados** por un profesional del
  derecho (`docs/REASSIGNMENT-POLICY.md`, sección legal) — los textos
  actuales son honestos sobre lo que el sistema hace, pero no han pasado
  una revisión jurídica formal.
- **Al menos una prueba end-to-end con un profesional real** (no de
  prueba) antes de anunciar el servicio como operativo: crear un lead de
  verdad, confirmar que la notificación real llega, que el profesional
  puede entrar al portal y responder, y que el ciclo completo se refleja
  bien en `/admin`.
- **Un procedimiento de incidencia** (mínimo: quién revisa
  `/admin/notificaciones` con `status = fallido` y
  `/admin/automatizaciones` con `errorCount > 0`, y con qué frecuencia).

## 6. Checklist mínima antes de decir "está en producción"

- [ ] Migración `0009` aplicada en la base de producción.
- [ ] `PROFESSIONAL_SESSION_SECRET` y `CRON_SECRET` configurados (valores
      propios, no los de `.env.local`).
- [ ] Cron verificado ejecutándose en Vercel (diario en el plan Hobby;
      más frecuente solo si se sube de plan).
- [ ] Proveedor de notificaciones real configurado y probado con un envío
      de prueba de verdad.
- [ ] Al menos un profesional real verificado, activo, con contraseña y
      con zona de cobertura.
- [ ] Un ciclo completo probado de extremo a extremo con datos reales
      (no de prueba).
- [ ] Textos legales revisados por alguien con competencia legal.

Hasta que todas estas casillas estén marcadas, el sistema es **técnicamente
correcto pero no comercialmente operativo** — ver
`docs/MVP-COMPLETION-AUDIT.md` para el estado exacto en cada momento.
