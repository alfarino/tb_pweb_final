/*
  Warnings:

  - The values [REJECTED,COMPLETED,CANCELLED] on the enum `barter_requests_status` will be removed. If these variants are still used in the database, this will fail.
  - The values [ITEM_SOLD,ITEM_LIKED,BARTER_REQUEST,BARTER_ACCEPTED,BARTER_REJECTED,WTB_RESPONSE,PRICE_ALERT,DISCUSSION_REPLY,SYSTEM_ANNOUNCEMENT,DONATION_REQUEST,BADGE_EARNED,AN_ITEM_POST] on the enum `notifications_type` will be removed. If these variants are still used in the database, this will fail.
  - The values [PAID,REFUNDED,FAILED] on the enum `transaksi_statusBayar` will be removed. If these variants are still used in the database, this will fail.
  - The values [VERIFIED_STUDENT,TOP_SELLER,HELPFUL_MEMBER,ACTIVE_TRADER,GENEROUS_DONOR,DISCUSSION_LEADER,EARLY_ADOPTER,TRUSTED_MEMBER] on the enum `user_badges_badgeType` will be removed. If these variants are still used in the database, this will fail.
  - The values [LOW,HIGH] on the enum `wtb_requests_urgency` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[itemId,sortOrder]` on the table `item_images` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `notifications_type_idx` ON `notifications`;

-- DropIndex
DROP INDEX `user_badges_badgeType_idx` ON `user_badges`;

-- AlterTable
ALTER TABLE `barter_requests` MODIFY `status` ENUM('PENDING', 'ACCEPTED', 'DECLINED') NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE `notifications` MODIFY `type` ENUM('TRANSACTION', 'MESSAGE', 'WARNING') NOT NULL;

-- AlterTable
ALTER TABLE `transaksi` MODIFY `statusBayar` ENUM('UNPAID', 'CANCELLED', 'DISPUTED') NOT NULL DEFAULT 'UNPAID';

-- AlterTable
ALTER TABLE `user_badges` MODIFY `badgeType` ENUM('TRUSTED', 'FAST_RESPONDER', 'VERIFIED') NOT NULL;

-- AlterTable
ALTER TABLE `wtb_requests` MODIFY `urgency` ENUM('NORMAL', 'URGENT') NOT NULL DEFAULT 'NORMAL';

-- CreateIndex
CREATE UNIQUE INDEX `item_images_itemId_sortOrder_key` ON `item_images`(`itemId`, `sortOrder`);
