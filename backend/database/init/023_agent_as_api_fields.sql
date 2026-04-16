-- =========================================
-- Agent-as-API Fields (idempotent)
-- =========================================

ALTER TABLE single_agents
ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) DEFAULT 'private' NOT NULL,
ADD COLUMN IF NOT EXISTS is_api_enabled BOOLEAN DEFAULT FALSE NOT NULL;

ALTER TABLE multi_agents
ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) DEFAULT 'private' NOT NULL,
ADD COLUMN IF NOT EXISTS is_api_enabled BOOLEAN DEFAULT FALSE NOT NULL;

ALTER TABLE api_keys
ADD COLUMN IF NOT EXISTS allowed_agent_ids UUID[] DEFAULT '{}';

CREATE TABLE IF NOT EXISTS api_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL,
    consumer_tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    provider_tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    response_time_ms INTEGER,
    status_code INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_usage_logs_api_key_id ON api_usage_logs(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_agent_id ON api_usage_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_consumer_tenant ON api_usage_logs(consumer_tenant_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_provider_tenant ON api_usage_logs(provider_tenant_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_created_at ON api_usage_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_single_agents_visibility ON single_agents(visibility);
CREATE INDEX IF NOT EXISTS idx_single_agents_is_api_enabled ON single_agents(is_api_enabled);
CREATE INDEX IF NOT EXISTS idx_multi_agents_visibility ON multi_agents(visibility);
CREATE INDEX IF NOT EXISTS idx_multi_agents_is_api_enabled ON multi_agents(is_api_enabled);
