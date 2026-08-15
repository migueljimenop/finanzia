-- CreateEnum
CREATE TYPE "Bank" AS ENUM ('SANTANDER', 'FALABELLA', 'MERCADO_PAGO', 'BANCO_CHILE');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "BucketType" AS ENUM ('INVESTMENT', 'HOME_TRANSFER', 'CREDIT_INSTALLMENT', 'AVAILABLE_MARGIN');

-- CreateEnum
CREATE TYPE "CalcMethod" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT', 'REMAINDER');

-- CreateEnum
CREATE TYPE "TxType" AS ENUM ('EXPENSE', 'INCOME', 'TRANSFER');

-- CreateEnum
CREATE TYPE "TxSource" AS ENUM ('MANUAL', 'IMPORT');

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bank" "Bank" NOT NULL,
    "type" "AccountType" NOT NULL,
    "balance" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'CLP',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "TxType" NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "description" TEXT,
    "categoryId" TEXT,
    "type" "TxType" NOT NULL,
    "source" "TxSource" NOT NULL DEFAULT 'MANUAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DistributionRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DistributionRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DistributionBucket" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "type" "BucketType" NOT NULL,
    "calcMethod" "CalcMethod" NOT NULL,
    "value" DECIMAL(14,2),
    "targetAccountId" TEXT,
    "order" INTEGER NOT NULL,

    CONSTRAINT "DistributionBucket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Income" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "description" TEXT,
    "ruleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Income_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncomeDistribution" (
    "id" TEXT NOT NULL,
    "incomeId" TEXT NOT NULL,
    "bucketId" TEXT NOT NULL,
    "type" "BucketType" NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "IncomeDistribution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE INDEX "Transaction_accountId_date_idx" ON "Transaction"("accountId", "date");

-- CreateIndex
CREATE INDEX "IncomeDistribution_incomeId_idx" ON "IncomeDistribution"("incomeId");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DistributionBucket" ADD CONSTRAINT "DistributionBucket_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "DistributionRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Income" ADD CONSTRAINT "Income_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Income" ADD CONSTRAINT "Income_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "DistributionRule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncomeDistribution" ADD CONSTRAINT "IncomeDistribution_incomeId_fkey" FOREIGN KEY ("incomeId") REFERENCES "Income"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncomeDistribution" ADD CONSTRAINT "IncomeDistribution_bucketId_fkey" FOREIGN KEY ("bucketId") REFERENCES "DistributionBucket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
