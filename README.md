# Finanzia

App personal de finanzas para consolidar tus cuentas, distribuir el sueldo en
"sobres" y controlar el **margen de gasto disponible** del mes y su proyección a
fin de mes.

## Qué hace

- **Multiusuario con autenticación** ([Better Auth](https://better-auth.com)) por
  email y contraseña. Cada usuario ve solo sus datos.
- **Cuentas** de cualquier banco (Santander, Banco de Chile, Falabella, Mercado
  Pago, …) con saldo, tipo (débito/crédito) y N° de cuenta para distinguir varias
  del mismo banco.
- **Distribución del sueldo en sobres** al registrar un ingreso: inversión, hogar,
  cuota de crédito y margen disponible (siempre el resto), con método de cálculo
  configurable (porcentaje o monto fijo) editable en `/regla`.
- **Movimientos**: registro manual o **importación de cartolas** en CSV/XLS/XLSX.
  Detecta automáticamente el formato de Santander, Banco de Chile y Falabella
  (parsers dedicados), y guarda la cartola original en disco.
- **Margen de gasto disponible**: margen mensual menos lo gastado en las cuentas
  relevantes, prorrateado a lo que queda del día.
- **Forecast de cierre de mes** y **alertas de gasto hormiga** por categoría.
- **Reportes**: gasto del mes por cuenta/categoría y comparativo de los últimos
  6 meses, con navegación mes a mes.

## Stack

- [Next.js 16](https://nextjs.org) (App Router) + TypeScript
- Tailwind CSS v4
- [Prisma 7](https://www.prisma.io) + PostgreSQL (driver adapter `@prisma/adapter-pg`)
- [Better Auth](https://better-auth.com) + `@better-auth/prisma-adapter`
- pnpm, Vitest, `papaparse` y `xlsx` (SheetJS)

## Requisitos

- Node.js 22+ (usa `.nvmrc`: `nvm use`)
- pnpm (`corepack enable` si no lo tienes activado)
- Un Postgres local, por cualquiera de estas dos vías:
  - **Docker**: `docker compose up -d` (puerto 5432)
  - **Sin Docker**: `npx prisma dev` levanta un Postgres local administrado por
    Prisma. Al iniciar imprime la `DATABASE_URL` a usar en `.env`. Su puerto puede
    cambiar entre reinicios (5121x).

## Setup

```bash
nvm use
pnpm install
cp .env.example .env
# Configura DATABASE_URL (la que imprime `prisma dev` o Docker) más:
#   BETTER_AUTH_SECRET="<genera una con: openssl rand -base64 32>"
#   BETTER_AUTH_URL="http://localhost:3000"
#   NEXT_PUBLIC_APP_URL="http://localhost:3000"
pnpm prisma generate
npx prisma db push        # crea/actualiza el esquema en la base
npx prisma db seed        # opcional: datos de ejemplo
pnpm dev
```

La app queda en `http://localhost:3000`. Al abrirla, crea tu cuenta desde
`/login` (sign-up). El seed crea un usuario `demo@finanzia.app` con cuentas,
categorías y una regla de distribución de ejemplo — no tiene contraseña
asignada, así que no sirve para iniciar sesión, solo como datos de referencia.

> **Autenticación**: las páginas privadas exigen sesión y redirigen a `/login`.
> Sin `BETTER_AUTH_SECRET` el login no funciona.

### Onboarding de un usuario nuevo

Al registrarte no partes de cero, pero tampoco todo viene precargado:

- Las **categorías de gasto por defecto** se crean automáticamente la primera
  vez que cargas cualquier página (`ensureDefaultCategories` en
  [`src/lib/onboarding.ts`](src/lib/onboarding.ts), llamado desde
  `requireUserId`). Es idempotente y también corrige retroactivamente a
  cuentas que quedaron vacías.
- Las **cuentas bancarias** las creas tú en `/cuentas` — son específicas de
  cada persona, no tiene sentido inventarlas.
- La **regla de distribución** la creas en `/regla` — los porcentajes y montos
  son una decisión financiera personal, así que tampoco se auto-genera con
  valores de ejemplo (podría inducir a error si alguien los deja sin revisar).
  Sin una regla activa no puedes registrar ingresos.
- El dashboard muestra una tarjeta **"Primeros pasos"** mientras falte alguna
  cuenta o la regla; desaparece sola cuando ambas existen.

## Modelo de datos

Esquema en [`prisma/schema.prisma`](prisma/schema.prisma). Todos los modelos de
negocio pertenecen a un `User` (`userId`), salvo las tablas de auth de Better Auth:

- **User / Session / AuthAccount / Verification**: cuentas y sesiones. La cuenta
  de auth se llama `AuthAccount` para no confundirse con la cuenta bancaria.
- **Account**: banco/tarjeta, saldo, tipo y N° de cuenta.
- **Category**: categorías de gasto/ingreso.
- **Transaction**: movimientos por cuenta (manual o importado).
- **DistributionRule / DistributionBucket**: regla que reparte el ingreso en
  sobres, cada uno con su método de cálculo.
- **Income / IncomeDistribution**: cada ingreso y el snapshot de cómo se repartió
  (así el margen de meses pasados no cambia si la regla se edita después).
- **Document**: cartolas importadas (archivo guardado en `uploads/` + metadatos).

### Margen de gasto disponible

La lógica vive en [`src/lib/margin.ts`](src/lib/margin.ts). Qué cuentas cuentan
como "disponible" se define en un solo lugar, [`src/lib/config.ts`](src/lib/config.ts)
(`SPEND_ACCOUNTS`), y lo usan también el forecast y las alertas para ser consistentes:

- **Margen mensual** = suma del sobre `AVAILABLE_MARGIN` de los ingresos del mes.
- **Gastado** = movimientos `EXPENSE` del mes en las cuentas de `SPEND_ACCOUNTS`
  (débito de Santander y Banco de Chile + tarjeta Falabella). Mercado Pago queda
  fuera porque ese dinero ya se asignó al sobre "hogar".
- **Disponible hoy** = (margen mensual − gastado) / días restantes del mes.

Los umbrales de alertas de gasto hormiga y los meses del comparativo también
viven en `src/lib/config.ts`.

## Scripts

```bash
pnpm dev              # servidor de desarrollo
pnpm build            # build de producción
pnpm start            # sirve el build
pnpm lint             # ESLint
pnpm test             # tests unitarios (Vitest)
npx prisma studio     # explorar la base de datos
npx prisma db push    # aplicar cambios de schema (prisma dev)
npx prisma db seed    # datos de ejemplo
```

## Notas

- El parser XLSX usó SheetJS desde su CDN oficial porque la versión publicada en
  npm (`0.18.5`) tiene CVEs sin parchear; SheetJS solo publica versiones
  corregidas en su propio CDN.
- Los archivos de cartolas importados se guardan en `uploads/` (en `.gitignore`,
  no servido). Esto no sobrevive en hosting serverless/efímero (ej. Vercel) —
  si se despliega ahí, hay que mover esto a un storage externo (S3, R2, etc.)
  antes.
- `BETTER_AUTH_URL` y `NEXT_PUBLIC_APP_URL` deben coincidir con el puerto real
  en el que corre el server — si no, el login falla con `ERR_CONNECTION_REFUSED`
  sin mensaje claro. Común al correr en un puerto distinto al de `.env`.
- Gaps conocidos, pendientes de una próxima pasada:
  - `accountId`/`categoryId` que llegan de formularios (`registerIncome`,
    `createMovement`, `updateMovement`, `importMovements`, `uploadDocument`) no
    se verifican contra `userId` antes de usarse — el resto de la app sí valida
    ownership consistentemente. Bajo riesgo (ids son cuids no adivinables) pero
    es el antipatrón que la propia guía de seguridad de Next.js pide evitar.
  - `Income.userId` no tiene `onDelete: Cascade` (a diferencia de Account,
    Category, Transaction y DistributionRule) — borrar un `User` con ingresos
    falla por FK a menos que se borren los ingresos primero.
  - El registro público está abierto sin restricción alguna.
  - CI solo corre `lint` + `build`, no `pnpm test`.