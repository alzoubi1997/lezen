-- Add composite indexes for better query performance

-- Index for dashboard queries: userId + finishedAt
CREATE INDEX IF NOT EXISTS "attempts_userId_finishedAt_idx" ON "attempts"("userId", "finishedAt");

-- Index for model completion queries: userId + done
CREATE INDEX IF NOT EXISTS "model_completions_userId_done_idx" ON "model_completions"("userId", "done");

