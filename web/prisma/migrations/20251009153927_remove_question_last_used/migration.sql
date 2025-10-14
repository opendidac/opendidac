/*
  Warnings:

  - You are about to drop the column `lastUsed` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `usageStatus` on the `Question` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Question" DROP COLUMN "lastUsed",
DROP COLUMN "usageStatus";

-- DropEnum
DROP TYPE "QuestionUsageStatus";
