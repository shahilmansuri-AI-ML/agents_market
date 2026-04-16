-- =========================================================
-- EXECUTION STATE
-- =========================================================

CREATE TABLE execution_state (
    execution_id UUID PRIMARY KEY
        REFERENCES executions(execution_id)
        ON DELETE CASCADE,

    state_snapshot JSONB NOT NULL DEFAULT '{}',
    last_completed_step_key VARCHAR(255),
    version INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_execution_state_updated_at
BEFORE UPDATE ON execution_state
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();