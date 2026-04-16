CREATE TABLE IF NOT EXISTS deployments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Tenant / ownership
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    -- Unified classification
    agent_type VARCHAR(20) NOT NULL CHECK (agent_type IN ('single', 'multi')),
    -- What is deployed
    agent_id UUID REFERENCES single_agents(id) ON DELETE CASCADE,
    multi_agent_id UUID REFERENCES multi_agents(id) ON DELETE CASCADE,
    -- Version reference (important for multi-agent workflow versioning)
    agent_version_id UUID REFERENCES agent_versions(id) ON DELETE SET NULL,
    -- Deployment lifecycle
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'INACTIVE', 'FAILED', 'ROLLBACK')),
    deployment_type VARCHAR(50) NOT NULL DEFAULT 'manual'
        CHECK (deployment_type IN ('manual', 'auto', 'rollback', 'redeploy')),
    -- Who deployed it
    deployed_by UUID NULL,
    -- Deployment metadata
    deployment_version INTEGER NOT NULL DEFAULT 1,
    environment VARCHAR(20) NOT NULL DEFAULT 'dev'
        CHECK (environment IN ('dev', 'staging', 'prod')),
    runtime_provider VARCHAR(50) DEFAULT 'custom'
        CHECK (runtime_provider IN ('custom', 'langgraph', 'crewai')),
    -- Error / observability
    failure_reason TEXT,
    deployment_notes TEXT,
    -- Immutable deployment snapshot
    config_snapshot JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Safety checks
    CONSTRAINT chk_deployment_target CHECK (
        (agent_id IS NOT NULL AND multi_agent_id IS NULL AND agent_type = 'single')
        OR
        (agent_id IS NULL AND multi_agent_id IS NOT NULL AND agent_type = 'multi')
    )
);

CREATE INDEX IF NOT EXISTS idx_deployments_agent_id
ON deployments(agent_id);

CREATE INDEX IF NOT EXISTS idx_deployments_multi_agent_id
ON deployments(multi_agent_id);

CREATE INDEX IF NOT EXISTS idx_deployments_tenant_id
ON deployments(tenant_id);

CREATE INDEX IF NOT EXISTS idx_deployments_status
ON deployments(status);

CREATE INDEX IF NOT EXISTS idx_deployments_agent_type
ON deployments(agent_type);

CREATE INDEX IF NOT EXISTS idx_deployments_created_at
ON deployments(created_at DESC);