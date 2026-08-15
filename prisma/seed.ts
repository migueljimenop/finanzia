import "dotenv/config";
import { PrismaClient, Bank, AccountType, BucketType, CalcMethod, TxType } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const ACCOUNTS: { name: string; bank: Bank; type: AccountType }[] = [
  { name: "Santander", bank: Bank.SANTANDER, type: AccountType.DEBIT },
  { name: "Falabella", bank: Bank.FALABELLA, type: AccountType.CREDIT },
  { name: "Mercado Pago", bank: Bank.MERCADO_PAGO, type: AccountType.DEBIT },
  { name: "Banco de Chile", bank: Bank.BANCO_CHILE, type: AccountType.DEBIT },
];

const EXPENSE_CATEGORIES = [
  "Arriendo y gastos del hogar",
  "Alimentación",
  "Transporte",
  "Salud",
  "Entretenimiento",
  "Suscripciones",
  "Otros",
];

async function seedAccounts() {
  const accounts: Record<string, string> = {};
  for (const account of ACCOUNTS) {
    const existing = await prisma.account.findFirst({ where: { name: account.name } });
    const record =
      existing ??
      (await prisma.account.create({
        data: { name: account.name, bank: account.bank, type: account.type, balance: 0 },
      }));
    accounts[account.name] = record.id;
  }
  return accounts;
}

async function seedCategories() {
  for (const name of EXPENSE_CATEGORIES) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name, kind: TxType.EXPENSE, isSystem: true },
    });
  }
  await prisma.category.upsert({
    where: { name: "Sueldo" },
    update: {},
    create: { name: "Sueldo", kind: TxType.INCOME, isSystem: true },
  });
}

async function seedDistributionRule(mercadoPagoAccountId: string) {
  const existing = await prisma.distributionRule.findFirst();
  if (existing) return;

  await prisma.distributionRule.create({
    data: {
      name: "Regla mensual (ejemplo)",
      isActive: true,
      buckets: {
        create: [
          {
            type: BucketType.INVESTMENT,
            calcMethod: CalcMethod.FIXED_AMOUNT,
            value: 300000,
            order: 1,
          },
          {
            type: BucketType.HOME_TRANSFER,
            calcMethod: CalcMethod.PERCENTAGE,
            value: 50,
            targetAccountId: mercadoPagoAccountId,
            order: 2,
          },
          {
            type: BucketType.CREDIT_INSTALLMENT,
            calcMethod: CalcMethod.FIXED_AMOUNT,
            value: 150000,
            order: 3,
          },
          {
            type: BucketType.AVAILABLE_MARGIN,
            calcMethod: CalcMethod.REMAINDER,
            value: null,
            order: 4,
          },
        ],
      },
    },
  });
}

async function main() {
  const accounts = await seedAccounts();
  await seedCategories();
  await seedDistributionRule(accounts["Mercado Pago"]);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
