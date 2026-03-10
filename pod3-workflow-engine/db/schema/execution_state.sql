-- Execution State Table (Resumability)
CREATE TABLE execution_state (
    execution_id UUID PRIMARY KEY
        REFERENCES executions(execution_id)
        ON DELETE CASCADE,

    -- Snapshot of runtime memory/state
    state_snapshot JSONB NOT NULL DEFAULT '{}',

    -- Last successfully completed step
    last_completed_step_key VARCHAR(255),

    -- Optimistic locking version
    version INTEGER NOT NULL DEFAULT 1,

    -- Timestamp
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
