-- AlterTable
ALTER TABLE "Account" ADD COLUMN "accountNumber" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Account_bank_accountNumber_key" ON "Account"("bank", "accountNumber");
