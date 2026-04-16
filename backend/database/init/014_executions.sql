
-- =========================================================
-- UPDATED_AT TRIGGER
-- Ensure updated_at trigger function exists before trigger creation in this and later init files.
-- =========================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================================================
-- EXECUTIONS
-- =========================================================

CREATE TABLE executions (
    execution_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Tenant / ownership
    tenant_id UUID NOT NULL,

    -- What is being executed
    target_id UUID NOT NULL,
    target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('single', 'multi')),

    -- Runtime identity
    workflow_id UUID REFERENCES workflows(id) ON DELETE SET NULL,
    agent_id UUID NULL,
    deployment_id UUID REFERENCES deployments(id) ON DELETE SET NULL,

    -- Snapshot references
    agent_version_id UUID NULL,
    deployment_snapshot JSONB NOT NULL DEFAULT '{}',
    workflow_version JSONB NOT NULL DEFAULT '{}',

    -- Trigger metadata
    trigger_type trigger_type NOT NULL DEFAULT 'manual',
    triggered_by_user_id UUID NULL,
    triggered_by VARCHAR(255),
    request_id UUID,
    correlation_id UUID,

    -- Lifecycle
    status execution_status NOT NULL DEFAULT 'PENDING',
    current_step_key VARCHAR(255),
    current_node_id VARCHAR(255),

    -- Parent-child execution
    parent_execution_id UUID REFERENCES executions(execution_id) ON DELETE SET NULL,

    -- Retry / scheduling
    retry_count INTEGER NOT NULL DEFAULT 0,
    max_retries INTEGER NOT NULL DEFAULT 3,
    next_retry_at TIMESTAMP WITH TIME ZONE NULL,

    -- Data
    input_payload JSONB NOT NULL DEFAULT '{}',
    output_payload JSONB NOT NULL DEFAULT '{}',
    error_message TEXT,
    error_payload JSONB NOT NULL DEFAULT '{}',

    -- Metrics
    total_steps INTEGER NOT NULL DEFAULT 0,
    completed_steps INTEGER NOT NULL DEFAULT 0,
    failed_steps INTEGER NOT NULL DEFAULT 0,

    -- Timing
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE NULL,
    completed_at TIMESTAMP WITH TIME ZONE NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_executions_tenant ON executions(tenant_id);
CREATE INDEX idx_executions_status ON executions(status);
CREATE INDEX idx_executions_target ON executions(target_id, target_type);
CREATE INDEX idx_executions_tenant_status ON executions(tenant_id, status);
CREATE INDEX idx_executions_deployment ON executions(deployment_id);
CREATE INDEX idx_executions_parent ON executions(parent_execution_id);
CREATE INDEX idx_executions_created_at ON executions(created_at DESC);
CREATE INDEX idx_executions_retry ON executions(status, next_retry_at);

CREATE TRIGGER update_executions_updated_at
BEFORE UPDATE ON executions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();