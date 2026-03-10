-- Execution Locks Table (Distributed Locking)
CREATE TABLE execution_locks (
    lock_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Lock target
    execution_id UUID NOT NULL
        REFERENCES executions(execution_id)
        ON DELETE CASCADE,

    step_execution_id UUID
        REFERENCES execution_steps(step_execution_id)
        ON DELETE CASCADE,

    lock_type lock_type NOT NULL,

    -- Worker info
    locked_by VARCHAR(255) NOT NULL,

    -- Lock timing
    locked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Prevent duplicate execution-level lock
    CONSTRAINT unique_execution_lock
        UNIQUE (execution_id)
        DEFERRABLE INITIALLY IMMEDIATE
);

CREATE INDEX idx_locks_execution 
ON execution_locks(execution_id);

CREATE INDEX idx_locks_expiry 
ON execution_locks(expires_at);

CREATE INDEX idx_locks_step 
ON execution_locks(step_execution_id);
