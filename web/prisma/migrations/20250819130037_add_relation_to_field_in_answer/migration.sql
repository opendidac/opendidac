-- AddForeignKey
ALTER TABLE "StudentAnswerExactMatchField" ADD CONSTRAINT "StudentAnswerExactMatchField_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "ExactMatchField"("id") ON DELETE CASCADE ON UPDATE CASCADE;
