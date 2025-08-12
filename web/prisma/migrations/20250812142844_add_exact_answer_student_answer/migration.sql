-- CreateTable
CREATE TABLE "StudentAnswerExactAnswer" (
    "userEmail" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,

    CONSTRAINT "StudentAnswerExactAnswer_pkey" PRIMARY KEY ("userEmail","questionId")
);

-- CreateTable
CREATE TABLE "ExactAnswerFieldToStudentAnswer" (
    "fieldId" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "value" TEXT,

    CONSTRAINT "ExactAnswerFieldToStudentAnswer_pkey" PRIMARY KEY ("fieldId","userEmail","questionId")
);

-- AddForeignKey
ALTER TABLE "StudentAnswerExactAnswer" ADD CONSTRAINT "StudentAnswerExactAnswer_userEmail_questionId_fkey" FOREIGN KEY ("userEmail", "questionId") REFERENCES "StudentAnswer"("userEmail", "questionId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExactAnswerFieldToStudentAnswer" ADD CONSTRAINT "ExactAnswerFieldToStudentAnswer_userEmail_questionId_fkey" FOREIGN KEY ("userEmail", "questionId") REFERENCES "StudentAnswerExactAnswer"("userEmail", "questionId") ON DELETE CASCADE ON UPDATE CASCADE;
