/*
  Warnings:

  - You are about to drop the column `codeCheckEnabled` on the `Code` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Code" DROP COLUMN "codeCheckEnabled";

-- AlterTable
ALTER TABLE "CodeWriting" ADD COLUMN     "codeCheckEnabled" BOOLEAN NOT NULL DEFAULT true;
