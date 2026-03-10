CREATE TABLE agent_registry (

    -- Identity
    agent_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Basic metadata
    agent_name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Agent classification
    agent_type VARCHAR(50) NOT NULL DEFAULT 'no_code',
    agent_mode VARCHAR(50) NOT NULL DEFAULT 'single_agent',

    -- Execution framework
    execution_framework VARCHAR(50) NOT NULL DEFAULT 'ollama',

    -- LLM configuration
    system_prompt TEXT NOT NULL,
    model_name VARCHAR(100) NOT NULL,

    -- No-code workflow definition (CRITICAL for Pod-3)
    workflow_definition JSONB,

    -- Deployment lifecycle
    status agent_status NOT NULL DEFAULT 'DRAFT',

    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT unique_agent_per_tenant
        UNIQUE (tenant_id, agent_name)
);