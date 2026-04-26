/*
  Warnings:

  - You are about to drop the column `pictureURL` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "pictureURL",
ADD COLUMN     "pictureUrl" TEXT,
ALTER COLUMN "password" DROP NOT NULL;
