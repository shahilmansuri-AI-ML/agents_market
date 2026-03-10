CREATE TABLE executions (
    execution_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Core references
    workflow_id VARCHAR(255) NOT NULL,
    tenant_id UUID NOT NULL,
    agent_id UUID NOT NULL,
    triggered_by_user_id UUID,

    -- Execution control
    trigger_type trigger_type NOT NULL,
    status execution_status NOT NULL DEFAULT 'PENDING',
    current_step_key VARCHAR(255),

    -- Parent-child execution (for subflows / agent calls)
    parent_execution_id UUID REFERENCES executions(execution_id) ON DELETE SET NULL,

    -- Data
    input_payload JSONB NOT NULL DEFAULT '{}',
    output_payload JSONB DEFAULT '{}',
    error_message TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


CREATE INDEX idx_executions_tenant 
ON executions(tenant_id);

CREATE INDEX idx_executions_status 
ON executions(status);

CREATE INDEX idx_executions_tenant_status 
ON executions(tenant_id, status);
