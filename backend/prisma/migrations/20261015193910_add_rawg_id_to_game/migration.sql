/*
  Warnings:

  - A unique constraint covering the columns `[rawgId]` on the table `Game` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `rawgId` to the `Game` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `Game` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `game` ADD COLUMN `rawgId` INTEGER NOT NULL,
    ADD COLUMN `slug` VARCHAR(200) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Game_rawgId_key` ON `Game`(`rawgId`);
