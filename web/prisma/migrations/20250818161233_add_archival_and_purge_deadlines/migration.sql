-- CreateEnum
CREATE TYPE "ArchivalPhase" AS ENUM ('ACTIVE', 'EXCLUDED_FROM_ARCHIVAL', 'MARKED_FOR_ARCHIVAL', 'ARCHIVED', 'PURGED');

-- AlterTable
ALTER TABLE "Evaluation" ADD COLUMN     "archivalDeadline" TIMESTAMP(3),
ADD COLUMN     "archivalPhase" "ArchivalPhase" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "purgeDeadline" TIMESTAMP(3);
