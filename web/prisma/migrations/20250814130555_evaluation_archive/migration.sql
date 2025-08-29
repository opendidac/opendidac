/*
  Fix: add 'INACTIVE' to the existing enum first, then update rows,
  then rebuild the enum without 'ARCHIVED'.
*/

-- 1) Add the new value to the existing enum so the UPDATE is valid
BEGIN;
ALTER TYPE "EvaluationStatus" ADD VALUE IF NOT EXISTS 'INACTIVE';
COMMIT;

-- 2) Update existing rows from ARCHIVED -> INACTIVE
UPDATE "Evaluation"
SET "status" = 'INACTIVE'
WHERE "status" = 'ARCHIVED';

-- 3) Rebuild the enum without ARCHIVED
BEGIN;
ALTER TABLE "Evaluation" ALTER COLUMN "status" DROP DEFAULT;

CREATE TYPE "EvaluationStatus_new" AS ENUM ('ACTIVE', 'INACTIVE');

ALTER TABLE "Evaluation"
  ALTER COLUMN "status" TYPE "EvaluationStatus_new"
  USING ("status"::text::"EvaluationStatus_new");

ALTER TYPE "EvaluationStatus" RENAME TO "EvaluationStatus_old";
ALTER TYPE "EvaluationStatus_new" RENAME TO "EvaluationStatus";
DROP TYPE "EvaluationStatus_old";

ALTER TABLE "Evaluation" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
COMMIT;

-- 4) Add new columns
ALTER TABLE "Evaluation"
  ADD COLUMN "archivedAt" TIMESTAMP(3),
  ADD COLUMN "archivedByUserEmail" TEXT;

-- 5) Add foreign key
ALTER TABLE "Evaluation"
  ADD CONSTRAINT "Evaluation_archivedByUserEmail_fkey"
  FOREIGN KEY ("archivedByUserEmail") REFERENCES "User"("email")
  ON DELETE SET NULL ON UPDATE CASCADE;
