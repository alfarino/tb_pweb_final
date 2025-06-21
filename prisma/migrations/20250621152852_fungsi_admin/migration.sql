-- AlterTable
ALTER TABLE `items` ADD COLUMN `approvalStatus` VARCHAR(191) NOT NULL DEFAULT 'pending',
    ADD COLUMN `approvedAt` DATETIME(3) NULL,
    ADD COLUMN `approvedById` INTEGER NULL;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `approvedAt` DATETIME(3) NULL,
    ADD COLUMN `approvedById` INTEGER NULL,
    ADD COLUMN `isApproved` BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_approvedById_fkey` FOREIGN KEY (`approvedById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `items` ADD CONSTRAINT `items_approvedById_fkey` FOREIGN KEY (`approvedById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
