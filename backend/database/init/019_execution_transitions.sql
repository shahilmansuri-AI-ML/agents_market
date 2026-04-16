-- =========================================================
-- EXECUTION TRANSITIONS
-- =========================================================

CREATE TABLE execution_transitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    execution_id UUID NOT NULL
        REFERENCES executions(execution_id) ON DELETE CASCADE,

    from_step_execution_id UUID NULL REFERENCES execution_steps(step_execution_id) ON DELETE SET NULL,
    to_step_execution_id UUID NULL REFERENCES execution_steps(step_execution_id) ON DELETE SET NULL,

    from_node_id VARCHAR(255),
    to_node_id VARCHAR(255),

    transition_type VARCHAR(50) NOT NULL DEFAULT 'NORMAL',

    condition_evaluated JSONB NOT NULL DEFAULT '{}',
    condition_result BOOLEAN,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transitions_execution ON execution_transitions(execution_id);
CREATE INDEX idx_transitions_from_node ON execution_transitions(from_node_id);
CREATE INDEX idx_transitions_to_node ON execution_transitions(to_node_id);