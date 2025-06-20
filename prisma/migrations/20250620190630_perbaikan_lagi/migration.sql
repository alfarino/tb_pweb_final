/*
  Warnings:

  - You are about to drop the column `barangId` on the `transaksi` table. All the data in the column will be lost.
  - Added the required column `itemId` to the `transaksi` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `transaksi` DROP FOREIGN KEY `transaksi_barangId_fkey`;

-- DropIndex
DROP INDEX `transaksi_barangId_idx` ON `transaksi`;

-- AlterTable
ALTER TABLE `transaksi` DROP COLUMN `barangId`,
    ADD COLUMN `itemId` INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX `transaksi_itemId_idx` ON `transaksi`(`itemId`);

-- AddForeignKey
ALTER TABLE `transaksi` ADD CONSTRAINT `transaksi_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `items`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
