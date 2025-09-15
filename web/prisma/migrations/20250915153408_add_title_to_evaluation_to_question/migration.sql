-- AlterTable
ALTER TABLE "EvaluationToQuestion" ADD COLUMN     "title" TEXT;

-- Update existing records to populate title with question title
UPDATE "EvaluationToQuestion" 
SET "title" = "Question"."title"
FROM "Question" 
WHERE "EvaluationToQuestion"."questionId" = "Question"."id";
