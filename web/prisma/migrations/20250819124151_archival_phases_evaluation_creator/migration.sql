-- CreateEnum
CREATE TYPE "ArchivalPhase" AS ENUM ('ACTIVE', 'MARKED_FOR_ARCHIVAL', 'ARCHIVED', 'PURGED', 'PURGED_WITHOUT_ARCHIVAL');

-- AlterTable
ALTER TABLE "Evaluation" 
ADD COLUMN     "archivalDeadline" TIMESTAMP(3),
ADD COLUMN     "archivalPhase" "ArchivalPhase" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "createdByUserEmail" TEXT;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_createdByUserEmail_fkey" FOREIGN KEY ("createdByUserEmail") REFERENCES "User"("email") ON DELETE SET NULL ON UPDATE CASCADE;
