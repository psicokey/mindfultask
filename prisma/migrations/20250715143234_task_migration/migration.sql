/*
  Warnings:

  - You are about to drop the column `user_id` on the `pomodoro_sessions` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `pomodoro_sessions` DROP FOREIGN KEY `pomodoro_sessions_user_id_fkey`;

-- DropIndex
DROP INDEX `pomodoro_sessions_user_id_fkey` ON `pomodoro_sessions`;

-- AlterTable
ALTER TABLE `pomodoro_sessions` DROP COLUMN `user_id`;
