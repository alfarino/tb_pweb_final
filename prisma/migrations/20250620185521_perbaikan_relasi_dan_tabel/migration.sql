/*
  Warnings:

  - You are about to drop the `transactions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `transactions` DROP FOREIGN KEY `transactions_buyerId_fkey`;

-- DropForeignKey
ALTER TABLE `transactions` DROP FOREIGN KEY `transactions_itemId_fkey`;

-- DropForeignKey
ALTER TABLE `transactions` DROP FOREIGN KEY `transactions_sellerId_fkey`;

-- AlterTable
ALTER TABLE `notifications` MODIFY `type` ENUM('ITEM_SOLD', 'ITEM_LIKED', 'BARTER_REQUEST', 'BARTER_ACCEPTED', 'BARTER_REJECTED', 'WTB_RESPONSE', 'PRICE_ALERT', 'DISCUSSION_REPLY', 'SYSTEM_ANNOUNCEMENT', 'DONATION_REQUEST', 'BADGE_EARNED', 'AN_ITEM_POST') NOT NULL;

-- DropTable
DROP TABLE `transactions`;

-- CreateTable
CREATE TABLE `transaksi` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pembeliId` INTEGER NOT NULL,
    `penjualId` INTEGER NOT NULL,
    `barangId` INTEGER NOT NULL,
    `jumlah` DECIMAL(10, 2) NOT NULL,
    `status` ENUM('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DISPUTED') NOT NULL DEFAULT 'PENDING',
    `metodeBayar` VARCHAR(191) NULL,
    `statusBayar` ENUM('UNPAID', 'PAID', 'REFUNDED', 'FAILED') NOT NULL DEFAULT 'UNPAID',
    `lokasiCOD` VARCHAR(191) NULL,
    `catatan` TEXT NULL,
    `selesaiPada` DATETIME(3) NULL,
    `dibuatPada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `diperbaruiPada` DATETIME(3) NOT NULL,

    INDEX `transaksi_pembeliId_idx`(`pembeliId`),
    INDEX `transaksi_penjualId_idx`(`penjualId`),
    INDEX `transaksi_barangId_idx`(`barangId`),
    INDEX `transaksi_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `transaksi` ADD CONSTRAINT `transaksi_pembeliId_fkey` FOREIGN KEY (`pembeliId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transaksi` ADD CONSTRAINT `transaksi_penjualId_fkey` FOREIGN KEY (`penjualId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transaksi` ADD CONSTRAINT `transaksi_barangId_fkey` FOREIGN KEY (`barangId`) REFERENCES `items`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
