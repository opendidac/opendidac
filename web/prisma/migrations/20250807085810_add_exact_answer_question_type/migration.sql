-- AlterEnum
ALTER TYPE "QuestionType" ADD VALUE 'exactAnswer';

-- CreateTable
CREATE TABLE "ExactAnswerQuestion" (
    "questionId" TEXT NOT NULL,

    CONSTRAINT "ExactAnswerQuestion_pkey" PRIMARY KEY ("questionId")
);

-- CreateTable
CREATE TABLE "ExactAnswerField" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "statement" TEXT,
    "matchRegex" TEXT,

    CONSTRAINT "ExactAnswerField_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExactAnswerField_order_key" ON "ExactAnswerField"("order");

-- AddForeignKey
ALTER TABLE "ExactAnswerQuestion" ADD CONSTRAINT "ExactAnswerQuestion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExactAnswerField" ADD CONSTRAINT "ExactAnswerField_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "ExactAnswerQuestion"("questionId") ON DELETE CASCADE ON UPDATE CASCADE;
