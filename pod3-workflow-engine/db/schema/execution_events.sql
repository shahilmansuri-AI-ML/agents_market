-- Execution Events (Append-Only Event Log)
CREATE TABLE execution_events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Parent execution
    execution_id UUID NOT NULL
        REFERENCES executions(execution_id)
        ON DELETE CASCADE,

    -- Optional step reference
    step_execution_id UUID
        REFERENCES execution_steps(step_execution_id)
        ON DELETE SET NULL,

    -- Event classification
    event_type event_type NOT NULL,
    source event_source NOT NULL,

    -- Event data
    event_payload JSONB NOT NULL DEFAULT '{}',

    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fetch events per execution (most common query)
CREATE INDEX idx_events_execution_time
ON execution_events(execution_id, created_at);

-- Step-level debugging
CREATE INDEX idx_events_step
ON execution_events(step_execution_id);

-- Event type filtering (optional analytics)
CREATE INDEX idx_events_type
ON execution_events(event_type);

