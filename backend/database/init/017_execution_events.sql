-- =========================================================
-- EXECUTION EVENTS
-- =========================================================

CREATE TABLE execution_events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    execution_id UUID NOT NULL
        REFERENCES executions(execution_id)
        ON DELETE CASCADE,

    step_execution_id UUID NULL
        REFERENCES execution_steps(step_execution_id)
        ON DELETE SET NULL,

    event_type event_type NOT NULL,
    source event_source NOT NULL,

    event_payload JSONB NOT NULL DEFAULT '{}',

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_events_execution_time ON execution_events(execution_id, created_at);
CREATE INDEX idx_events_step ON execution_events(step_execution_id);
CREATE INDEX idx_events_type ON execution_events(event_type);