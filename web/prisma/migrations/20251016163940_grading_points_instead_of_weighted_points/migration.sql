/*
  Warnings:

  - You are about to drop the column `weightedPoints` on the `EvaluationToQuestion` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "EvaluationToQuestion" DROP COLUMN "weightedPoints",
ADD COLUMN     "gradingPoints" DOUBLE PRECISION NOT NULL DEFAULT 0;
