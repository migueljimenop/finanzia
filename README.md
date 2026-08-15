# Finanzia

App personal de finanzas para consolidar las cuentas de Santander, Falabella,
Mercado Pago y Banco de Chile, automatizar la distribución del sueldo en
"sobres" y calcular el margen de gasto disponible del mes.

## Stack

- [Next.js 16](https://nextjs.org) (App Router) + TypeScript
- Tailwind CSS v4
- [Prisma 7](https://www.prisma.io) + PostgreSQL (driver adapter `@prisma/adapter-pg`)
- pnpm

## Requisitos

- Node.js 22+ (usa `.nvmrc`: `nvm use`)
- pnpm (`corepack enable` si no lo tienes activado)
- Un Postgres local, por cualquiera de estas dos vías:
  - **Docker**: `docker compose up -d` (usa `docker-compose.yml`, puerto 5432)
  - **Sin Docker**: `npx prisma dev` levanta un Postgres local administrado por
    Prisma. Al iniciar imprime la `DATABASE_URL` a usar en `.env`.

## Setup

```bash
nvm use
pnpm install
cp .env.example .env   # o pega la URL que imprime `npx prisma dev`
pnpm prisma migrate dev
pnpm prisma db seed
pnpm dev
```

La app queda disponible en `http://localhost:3000`. El seed crea las 4
cuentas (Santander, Falabella, Mercado Pago, Banco de Chile), categorías de
gasto por defecto y una regla de distribución de ejemplo.

## Modelo de datos

Definido en [`prisma/schema.prisma`](prisma/schema.prisma):

- **Account**: cada banco/tarjeta, con saldo y tipo (débito/crédito).
- **Category**: categorías de gasto/ingreso.
- **Transaction**: movimientos por cuenta (manual o importado; la importación
  se construye en la Etapa 2).
- **DistributionRule** / **DistributionBucket**: la regla que reparte un
  ingreso en sobres (inversión, hogar, cuota de crédito, margen de gasto),
  cada uno con método de cálculo (porcentaje, monto fijo o resto).
- **Income** / **IncomeDistribution**: cada ingreso registrado y el
  snapshot histórico de cómo se repartió en su momento (así el cálculo del
  margen de meses pasados no cambia si la regla se edita después).

### Margen de gasto disponible

Se calcula en [`src/lib/margin.ts`](src/lib/margin.ts):

- **Margen mensual** = suma de `IncomeDistribution` del sobre
  `AVAILABLE_MARGIN` para ingresos del mes actual.
- **Gastado** = suma de `Transaction` tipo `EXPENSE` del mes en cuentas
  débito de Santander y Banco de Chile (Mercado Pago queda fuera porque ese
  dinero ya se asignó al sobre "hogar" al momento de la distribución).
- **Disponible hoy** = (margen mensual − gastado) / días restantes del mes.

## Scripts

```bash
pnpm dev              # servidor de desarrollo
pnpm build             # build de producción
pnpm lint               # ESLint
pnpm prisma studio      # explorar la base de datos
pnpm prisma migrate dev # nueva migración tras cambiar el schema
pnpm prisma db seed     # re-ejecutar el seed
```

## Estado del proyecto

### Etapa 0 — Fundación ✅
Proyecto scaffoldeado, modelo de datos definido, Postgres + Prisma
configurados, seed y CI de lint/build.

### Etapa 1 — MVP núcleo ✅
- CRUD de cuentas (`/cuentas`)
- Registro de ingreso + aplicación automática de la regla de distribución
  activa (`/ingresos`)
- Cálculo de margen de gasto disponible (mensual y prorrateado a hoy)
- Dashboard consolidado (`/`)

### Falta para las próximas etapas
- **Etapa 2 — Movimientos**: registro manual de gastos y categorización
  desde la UI (el modelo `Transaction` ya existe y ya alimenta el cálculo
  de margen; falta el CRUD), más importación de cartolas CSV/Excel por
  banco.
- **Etapa 3 — Reportes**: vistas por banco, tarjeta y categoría, mensual y
  comparativo.
- **Etapa 4 — Forecast y alertas**: proyección de cierre de mes y alertas
  de gasto hormiga cuando el acumulado se desvía del promedio histórico.
- Gestión de reglas de distribución desde la UI (hoy solo existe la regla
  sembrada por el seed; para cambiarla hay que editar la base directamente).
