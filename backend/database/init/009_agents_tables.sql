-- =========================================
-- Tools Table
-- =========================================
CREATE TABLE IF NOT EXISTS tools (
    tool_id SERIAL PRIMARY KEY,
    tool_name VARCHAR(100) NOT NULL UNIQUE,
    tool_api TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO tools (tool_name, tool_api) VALUES
('Weather Tool', 'https://api.open-meteo.com/v1/forecast'),
('Wikipedia Tool', 'https://api.wikipedia.org/api/rest_v1/page/summary/'),
('Calculator Tool', 'internal://calculator'),
('Currency Tool', 'https://api.exchangerate.host/convert'),
('News Tool', 'https://newsapi.org/v2/top-headlines')
ON CONFLICT (tool_name) DO NOTHING;

-- =========================================
-- LLM Models Table
-- =========================================
CREATE TABLE IF NOT EXISTS llm_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_name VARCHAR(50) NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    model_api TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(provider_name, model_name)
);

-- Pehle ye check karein ki uuid-ossp extension enabled hai (UUID generate karne ke liye)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

INSERT INTO llm_models (provider_name, model_name, model_api)
VALUES 
    ('OpenAI', 'gpt-4o', ' https://openrouter.ai/api/v1'),
    ('Anthropic', 'claude-3-5-sonnet-20240620', 'https://api.anthropic.com/v1'),
    ('Google', 'gemini-1.5-pro', 'https://generativelanguage.googleapis.com/v1beta'),
    ('Meta', 'llama-3.1-405b', 'https://api.meta.com/llama/v1'),
    ('Mistral AI', 'mistral-large-latest', 'https://api.mistral.ai/v1')
ON CONFLICT (provider_name, model_name) DO NOTHING;


-- =========================================
-- Single Agents Table
-- =========================================
CREATE TABLE IF NOT EXISTS single_agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    instruction TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'DRAFT' NOT NULL,
    tool_id INTEGER REFERENCES tools(tool_id),
    llm_model_id UUID REFERENCES llm_models(id),
    agent_type VARCHAR(20) NOT NULL DEFAULT 'single',
    visibility VARCHAR(20) DEFAULT 'private' NOT NULL,
    is_api_enabled BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =========================================
-- Multi Agents Table
-- =========================================
CREATE TABLE IF NOT EXISTS multi_agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL,
    agent_type VARCHAR(20) NOT NULL DEFAULT 'multi',
    visibility VARCHAR(20) DEFAULT 'private' NOT NULL,
    is_api_enabled BOOLEAN DEFAULT FALSE NOT NULL,
    tags TEXT[],
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =========================================
-- Agent Tools Table
-- =========================================
CREATE TABLE IF NOT EXISTS agent_tools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID REFERENCES single_agents(id) ON DELETE CASCADE,
    tool_id INTEGER REFERENCES tools(tool_id) ON DELETE CASCADE,
    config_json JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(agent_id, tool_id)
);

-- =========================================
-- Agent Versions Table
-- =========================================
CREATE TABLE IF NOT EXISTS agent_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    multi_agent_id UUID NOT NULL REFERENCES multi_agents(id) ON DELETE CASCADE,
    version VARCHAR(50) NOT NULL,
    json_spec JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(multi_agent_id, version)
);

-- =========================================
-- Workflows Table
-- =========================================
CREATE TABLE IF NOT EXISTS workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    multi_agent_id UUID NOT NULL REFERENCES multi_agents(id) ON DELETE CASCADE,
    name VARCHAR(150),
    description TEXT,
    workflow_json JSONB NOT NULL DEFAULT '{"nodes":[],"edges":[]}'::jsonb,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =========================================
-- Agent Nodes Table
-- =========================================
CREATE TABLE IF NOT EXISTS agent_nodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_version_id UUID REFERENCES agent_versions(id) ON DELETE CASCADE,
    multi_agent_id UUID REFERENCES multi_agents(id),
    agent_id UUID REFERENCES single_agents(id),
    node_type VARCHAR(50) NOT NULL, -- LLM, TOOL, CONDITION, INPUT, OUTPUT
    name VARCHAR(100),
    config JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =========================================
-- Agent Edges Table
-- =========================================
CREATE TABLE IF NOT EXISTS agent_edges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_version_id UUID REFERENCES agent_versions(id) ON DELETE CASCADE,
    source_node_id UUID REFERENCES agent_nodes(id) ON DELETE CASCADE,
    target_node_id UUID REFERENCES agent_nodes(id) ON DELETE CASCADE,
    edge_type VARCHAR(50) DEFAULT 'NORMAL', -- NORMAL, CONDITIONAL, FALLBACK
    condition JSONB, -- for branching logic
    created_at TIMESTAMP DEFAULT NOW()
);

-- =========================================
-- Personas Table
-- =========================================
CREATE TABLE IF NOT EXISTS personas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    config_json JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =========================================
-- Prompts Table
-- =========================================
CREATE TABLE IF NOT EXISTS prompts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    tags TEXT[],
    created_at TIMESTAMP DEFAULT NOW()
);

-- =========================================
-- Conversations Table
-- =========================================
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    multi_agent_id UUID REFERENCES multi_agents(id),
    agent_version_id UUID REFERENCES agent_versions(id),
    title TEXT DEFAULT 'New Chat',
    created_at TIMESTAMP DEFAULT NOW()
);

-- =========================================
-- Messages Table
-- =========================================
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) CHECK (role IN ('user','assistant','system')),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =========================================
-- Feedbacks Table
-- =========================================
CREATE TABLE IF NOT EXISTS feedbacks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_name VARCHAR(50) NOT NULL,
    rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
    comments TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =========================================
-- Agent Memory Table
-- =========================================
CREATE TABLE IF NOT EXISTS agent_memories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES single_agents(id),
    memory_type VARCHAR(50),
    content JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =========================================
-- Agent logs Table
-- =========================================
CREATE TABLE IF NOT EXISTS agent_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- workflow_run_id UUID REFERENCES workflow_runs(id),
    -- node_run_id UUID REFERENCES node_runs(id),
    level VARCHAR(20),
    message TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =========================================
--  Create indexes for agent tables
-- =========================================
CREATE INDEX idx_single_agents_tenant ON single_agents(tenant_id);
CREATE INDEX idx_multi_agents_tenant ON multi_agents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_single_agents_visibility ON single_agents(visibility);
CREATE INDEX IF NOT EXISTS idx_single_agents_is_api_enabled ON single_agents(is_api_enabled);
CREATE INDEX IF NOT EXISTS idx_multi_agents_visibility ON multi_agents(visibility);
CREATE INDEX IF NOT EXISTS idx_multi_agents_is_api_enabled ON multi_agents(is_api_enabled);
CREATE INDEX idx_workflows_multi_agent ON workflows(multi_agent_id);
CREATE INDEX idx_nodes_version ON agent_nodes(agent_version_id);
CREATE INDEX idx_edges_version ON agent_edges(agent_version_id);
CREATE INDEX idx_personas_tenant ON personas(tenant_id);
CREATE INDEX idx_prompts_tenant ON prompts(tenant_id);
CREATE INDEX idx_conversations_tenant ON conversations(tenant_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
