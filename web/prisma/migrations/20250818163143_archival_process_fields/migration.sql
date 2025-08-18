-- AlterTable
ALTER TABLE "Evaluation" ADD COLUMN     "excludedFromArchivalAt" TIMESTAMP(3),
ADD COLUMN     "excludedFromArchivalByUserEmail" TEXT,
ADD COLUMN     "excludedFromArchivalComment" TEXT;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_excludedFromArchivalByUserEmail_fkey" FOREIGN KEY ("excludedFromArchivalByUserEmail") REFERENCES "User"("email") ON DELETE SET NULL ON UPDATE CASCADE;
