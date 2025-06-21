/*
  Warnings:

  - You are about to alter the column `approvalStatus` on the `items` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(1))`.

*/
-- AlterTable
ALTER TABLE `items` MODIFY `approvalStatus` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending';
