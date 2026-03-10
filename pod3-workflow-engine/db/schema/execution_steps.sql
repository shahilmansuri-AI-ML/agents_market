-- Execution Steps Table
CREATE TABLE execution_steps (
    step_execution_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Parent execution
    execution_id UUID NOT NULL
        REFERENCES executions(execution_id)
        ON DELETE CASCADE,

    -- Step identification
    step_name VARCHAR(255) NOT NULL,
    step_key VARCHAR(255) NOT NULL,
    step_order INTEGER NOT NULL,
    step_type step_type NOT NULL,

    -- Status tracking
    status step_status NOT NULL DEFAULT 'PENDING',

    -- Retry configuration
    retry_count INTEGER NOT NULL DEFAULT 0,
    max_retries INTEGER NOT NULL DEFAULT 3,

    -- Data
    input_payload JSONB NOT NULL DEFAULT '{}',
    output_payload JSONB DEFAULT '{}',
    error_message TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ensure step order is unique per execution
    UNIQUE (execution_id, step_order),

    -- Ensure step_key is unique per execution
    UNIQUE (execution_id, step_key)
);


CREATE INDEX idx_steps_execution 
ON execution_steps(execution_id);

CREATE INDEX idx_steps_status 
ON execution_steps(status);

CREATE INDEX idx_steps_execution_status 
ON execution_steps(execution_id, status);
