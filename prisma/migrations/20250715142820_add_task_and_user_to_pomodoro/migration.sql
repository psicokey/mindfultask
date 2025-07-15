-- CreateTable
CREATE TABLE `tasks` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `due_date` DATETIME(3) NULL,
    `priority` VARCHAR(191) NOT NULL DEFAULT 'medium',
    `is_completed` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `userId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable
-- Primero, añade la columna como nullable (temporalmente)
ALTER TABLE `pomodoro_sessions` ADD COLUMN `userId` INTEGER;

-- Actualiza las filas existentes con un valor por defecto TEMPORAL
-- ¡¡IMPORTANTE!! Reemplaza '1' con el ID de un usuario existente en tu tabla 'users'.
-- Si no tienes usuarios, crea uno manualmente en tu base de datos primero.
UPDATE `pomodoro_sessions` SET `userId` = 1 WHERE `userId` IS NULL;

-- Luego, altera la columna para que sea NOT NULL
ALTER TABLE `pomodoro_sessions` MODIFY `userId` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pomodoro_sessions` ADD CONSTRAINT `pomodoro_sessions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
