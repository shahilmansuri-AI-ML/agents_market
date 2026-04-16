-- =========================================
-- Usage Quotas Table
-- =========================================
CREATE TABLE IF NOT EXISTS usage_quotas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consumer_tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES single_agents(id) ON DELETE CASCADE,
    monthly_limit INT NOT NULL DEFAULT -1,
    used_count INT NOT NULL DEFAULT 0,
    reset_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(consumer_tenant_id, agent_id)
);

CREATE INDEX IF NOT EXISTS idx_usage_quotas_consumer_tenant ON usage_quotas(consumer_tenant_id);
CREATE INDEX IF NOT EXISTS idx_usage_quotas_agent ON usage_quotas(agent_id);
CREATE INDEX IF NOT EXISTS idx_usage_quotas_reset_at ON usage_quotas(reset_at);
