-- DropForeignKey
ALTER TABLE "Income" DROP CONSTRAINT "Income_accountId_fkey";

-- AddForeignKey
ALTER TABLE "Income" ADD CONSTRAINT "Income_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

