-- =========================================================
-- EXECUTION STEPS
-- =========================================================

CREATE TABLE execution_steps (
    step_execution_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    execution_id UUID NOT NULL
        REFERENCES executions(execution_id)
        ON DELETE CASCADE,

    -- Step identity
    step_name VARCHAR(255) NOT NULL,
    step_key VARCHAR(255) NOT NULL,
    step_order INTEGER NOT NULL,
    step_type step_type NOT NULL,

    -- Graph/node identity
    node_id VARCHAR(255),
    node_type VARCHAR(100),
    parent_step_execution_id UUID NULL REFERENCES execution_steps(step_execution_id) ON DELETE SET NULL,

    -- Status
    status step_status NOT NULL DEFAULT 'PENDING',

    -- Retry
    retry_count INTEGER NOT NULL DEFAULT 0,
    max_retries INTEGER NOT NULL DEFAULT 3,
    next_retry_at TIMESTAMP WITH TIME ZONE,
    error_type VARCHAR(255),

    -- Data
    input_payload JSONB NOT NULL DEFAULT '{}',
    output_payload JSONB NOT NULL DEFAULT '{}',
    error_message TEXT,
    metadata JSONB NOT NULL DEFAULT '{}',

    -- Timing
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE NULL,
    completed_at TIMESTAMP WITH TIME ZONE NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    UNIQUE (execution_id, step_order),
    UNIQUE (execution_id, step_key)
);

CREATE INDEX idx_steps_execution ON execution_steps(execution_id);
CREATE INDEX idx_steps_status ON execution_steps(status);
CREATE INDEX idx_steps_execution_status ON execution_steps(execution_id, status);
CREATE INDEX idx_steps_retry_schedule ON execution_steps(status, next_retry_at);
CREATE INDEX idx_steps_node_id ON execution_steps(node_id);

CREATE TRIGGER update_execution_steps_updated_at
BEFORE UPDATE ON execution_steps
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();