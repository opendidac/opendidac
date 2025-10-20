-- AlterTable
ALTER TABLE "EvaluationToQuestion" ADD COLUMN     "gradingPoints" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Populate gradingPoints with existing points values
UPDATE "EvaluationToQuestion" SET "gradingPoints" = "points";
