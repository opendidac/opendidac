-- DropForeignKey
ALTER TABLE "UserOnEvaluationDeniedAccessAttempt" DROP CONSTRAINT "UserOnEvaluationDeniedAccessAttempt_evaluationId_fkey";

-- AddForeignKey
ALTER TABLE "UserOnEvaluationDeniedAccessAttempt" ADD CONSTRAINT "UserOnEvaluationDeniedAccessAttempt_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "Evaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
