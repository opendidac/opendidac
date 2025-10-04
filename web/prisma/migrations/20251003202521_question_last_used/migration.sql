-- ============================================
-- 0) Create enum (fresh migration)
-- ============================================
CREATE TYPE "QuestionUsageStatus" AS ENUM ('UNUSED', 'USED', 'NOT_APPLICABLE');

-- ============================================
-- 1) Ensure columns exist
-- ============================================
ALTER TABLE "Question"
  ADD COLUMN IF NOT EXISTS "lastUsed" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "usageStatus" "QuestionUsageStatus" NOT NULL DEFAULT 'UNUSED';

-- ============================================
-- 2) Backfill Evaluation.startAt
--    2a) earliest attendance
--    2b) fallback: updatedAt
-- ============================================

-- 2a
UPDATE "Evaluation" e
SET "startAt" = s.first_registered_at
FROM (
  SELECT
    uoe."evaluationId"      AS eval_id,
    MIN(uoe."registeredAt") AS first_registered_at
  FROM "UserOnEvaluation" uoe
  GROUP BY uoe."evaluationId"
) s
WHERE e.id = s.eval_id
  AND e."phase" IN ('IN_PROGRESS','GRADING','FINISHED')
  AND e."startAt" IS NULL;

-- 2b
UPDATE "Evaluation" e
SET "startAt" = e."updatedAt"
WHERE e."phase" IN ('IN_PROGRESS','GRADING','FINISHED')
  AND e."startAt" IS NULL;

-- ============================================
-- 3) Usage semantics refresh
--    Spec:
--      - EVAL  => NOT_APPLICABLE (lastUsed = NULL)
--      - BANK/COPY => USED iff they parent an EVAL question
--        placed in a qualifying evaluation
--        lastUsed = MAX(e.startAt) over those placements
-- ============================================

-- 3a) EVAL → NOT_APPLICABLE
UPDATE "Question" q
SET "usageStatus" = 'NOT_APPLICABLE'::"QuestionUsageStatus",
    "lastUsed"    = NULL
WHERE q."source" = 'EVAL'
  AND (q."usageStatus" IS DISTINCT FROM 'NOT_APPLICABLE'::"QuestionUsageStatus"
       OR q."lastUsed" IS NOT NULL);

-- 3b) BANK/COPY usage via direct parentage of placed EVAL
WITH "parent_usage" AS (
  SELECT
    q_parent."id"    AS question_id,
    MAX(e."startAt") AS computed_last_used
  FROM "Question" AS q_parent
  JOIN "Question" AS q_eval
    ON q_eval."sourceQuestionId" = q_parent."id"
   AND q_eval."source" = 'EVAL'
  JOIN "EvaluationToQuestion" AS etq
    ON etq."questionId" = q_eval."id"
  JOIN "Evaluation" AS e
    ON e."id" = etq."evaluationId"
   AND e."phase" IN ('IN_PROGRESS','GRADING','FINISHED')
  WHERE q_parent."source" IN ('BANK','COPY')
  GROUP BY q_parent."id"
),
"usage_truth" AS (
  SELECT
    q."id" AS question_id,
    (pu.question_id IS NOT NULL) AS should_be_used,
    pu.computed_last_used
  FROM "Question" q
  LEFT JOIN "parent_usage" pu
    ON pu.question_id = q."id"
  WHERE q."source" IN ('BANK','COPY')
)
UPDATE "Question" q
SET
  "usageStatus" = CASE WHEN ut.should_be_used
                       THEN 'USED'::"QuestionUsageStatus"
                       ELSE 'UNUSED'::"QuestionUsageStatus" END,
  "lastUsed"    = ut.computed_last_used
FROM "usage_truth" ut
WHERE q."id" = ut.question_id
  AND (
    q."usageStatus" <> CASE WHEN ut.should_be_used
                            THEN 'USED'::"QuestionUsageStatus"
                            ELSE 'UNUSED'::"QuestionUsageStatus" END
    OR q."lastUsed" IS DISTINCT FROM ut.computed_last_used
  );
