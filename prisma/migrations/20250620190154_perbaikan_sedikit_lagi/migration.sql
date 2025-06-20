/*
  Warnings:

  - You are about to drop the column `dibuatPada` on the `transaksi` table. All the data in the column will be lost.
  - You are about to drop the column `diperbaruiPada` on the `transaksi` table. All the data in the column will be lost.
  - You are about to drop the column `selesaiPada` on the `transaksi` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `transaksi` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `transaksi` DROP COLUMN `dibuatPada`,
    DROP COLUMN `diperbaruiPada`,
    DROP COLUMN `selesaiPada`,
    ADD COLUMN `completedAt` DATETIME(3) NULL,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;
