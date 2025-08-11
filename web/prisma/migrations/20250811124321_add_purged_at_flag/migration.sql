-- AlterTable
ALTER TABLE "Evaluation" ADD COLUMN     "purgedAt" TIMESTAMP(3),
ADD COLUMN     "purgedByUserEmail" TEXT;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_purgedByUserEmail_fkey" FOREIGN KEY ("purgedByUserEmail") REFERENCES "User"("email") ON DELETE SET NULL ON UPDATE CASCADE;
