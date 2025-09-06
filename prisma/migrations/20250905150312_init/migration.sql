/*
  Warnings:

  - You are about to drop the column `paymentId` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the `Payment` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_paymentId_fkey";

-- DropIndex
DROP INDEX "Order_paymentId_key";

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "paymentId";

-- DropTable
DROP TABLE "Payment";
