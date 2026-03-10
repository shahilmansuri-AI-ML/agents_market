-- Execution Status
CREATE TYPE execution_status AS ENUM (
    'PENDING',      -- Waiting to start
    'RUNNING',      -- Currently executing
    'COMPLETED',    -- Successfully finished
    'FAILED',       -- Execution failed
    'CANCELLED'     -- Manually stopped
);

-- Step Status
CREATE TYPE step_status AS ENUM (
    'PENDING',
    'RUNNING',
    'COMPLETED',
    'FAILED'
);

-- Trigger Type
CREATE TYPE trigger_type AS ENUM (
    'manual',
    'cron',
    'event',
    'agent_call'
);

-- Step Type
CREATE TYPE step_type AS ENUM (
    'llm',
    'tool',
    'agent_call',
    'condition'
);

-- Event Type
CREATE TYPE event_type AS ENUM (
    'EXECUTION_STARTED',
    'EXECUTION_COMPLETED',
    'EXECUTION_FAILED',
    'STEP_STARTED',
    'STEP_COMPLETED',
    'STEP_FAILED',
    'AGENT_INVOKED',
    'AGENT_RESPONSE',
    'RETRY_SCHEDULED'
);

-- Event Source
CREATE TYPE event_source AS ENUM (
    'executor',
    'orchestrator',
    'agent'
);

-- Lock Type
CREATE TYPE lock_type AS ENUM (
    'execution',
    'step'
);

-- Agent Status Enum
CREATE TYPE agent_status AS ENUM (
    'DRAFT',
    'DEPLOYED',
    'PAUSED',
    'ARCHIVED'
);

-- Agent Type Enum
CREATE TYPE agent_type AS ENUM (
    'low_code',
    'high_code',
    'no_code'
);

