-- =========================================================
-- EXECUTION LOCKS
-- =========================================================

CREATE TABLE execution_locks (
    lock_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    execution_id UUID NOT NULL
        REFERENCES executions(execution_id)
        ON DELETE CASCADE,

    step_execution_id UUID NULL
        REFERENCES execution_steps(step_execution_id)
        ON DELETE CASCADE,

    lock_type lock_type NOT NULL,

    locked_by VARCHAR(255) NOT NULL,
    locked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX unique_execution_lock_idx
ON execution_locks(execution_id)
WHERE step_execution_id IS NULL;

CREATE UNIQUE INDEX unique_step_lock_idx
ON execution_locks(step_execution_id)
WHERE step_execution_id IS NOT NULL;

CREATE INDEX idx_locks_execution ON execution_locks(execution_id);
CREATE INDEX idx_locks_expiry ON execution_locks(expires_at);
CREATE INDEX idx_locks_step ON execution_locks(step_execution_id);