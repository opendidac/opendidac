-- AlterTable
ALTER TABLE "Evaluation" ADD COLUMN     "pin" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Evaluation_pin_key" ON "Evaluation"("pin");
