-- CreateEnum
CREATE TYPE "QuestionStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "status" "QuestionStatus" NOT NULL DEFAULT 'ACTIVE';
