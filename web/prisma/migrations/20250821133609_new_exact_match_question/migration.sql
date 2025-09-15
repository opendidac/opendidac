-- AlterEnum
ALTER TYPE "QuestionType" ADD VALUE 'exactMatch';

-- CreateTable
CREATE TABLE "ExactMatch" (
    "questionId" TEXT NOT NULL,

    CONSTRAINT "ExactMatch_pkey" PRIMARY KEY ("questionId")
);

-- CreateTable
CREATE TABLE "ExactMatchField" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "statement" TEXT,
    "matchRegex" TEXT,

    CONSTRAINT "ExactMatchField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentAnswerExactMatch" (
    "userEmail" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,

    CONSTRAINT "StudentAnswerExactMatch_pkey" PRIMARY KEY ("userEmail","questionId")
);

-- CreateTable
CREATE TABLE "StudentAnswerExactMatchField" (
    "fieldId" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "value" TEXT,

    CONSTRAINT "StudentAnswerExactMatchField_pkey" PRIMARY KEY ("fieldId","userEmail","questionId")
);

-- AddForeignKey
ALTER TABLE "ExactMatch" ADD CONSTRAINT "ExactMatch_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExactMatchField" ADD CONSTRAINT "ExactMatchField_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "ExactMatch"("questionId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAnswerExactMatch" ADD CONSTRAINT "StudentAnswerExactMatch_userEmail_questionId_fkey" FOREIGN KEY ("userEmail", "questionId") REFERENCES "StudentAnswer"("userEmail", "questionId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAnswerExactMatchField" ADD CONSTRAINT "StudentAnswerExactMatchField_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "ExactMatchField"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAnswerExactMatchField" ADD CONSTRAINT "StudentAnswerExactMatchField_userEmail_questionId_fkey" FOREIGN KEY ("userEmail", "questionId") REFERENCES "StudentAnswerExactMatch"("userEmail", "questionId") ON DELETE CASCADE ON UPDATE CASCADE;
