/*
  Warnings:

  - You are about to drop the column `coefficient` on the `EvaluationToQuestion` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "EvaluationToQuestion" DROP COLUMN "coefficient",
ADD COLUMN     "weightedPoints" DOUBLE PRECISION NOT NULL DEFAULT 0;
