-- =========================================================
-- ENUMS
-- =========================================================

CREATE TYPE execution_status AS ENUM (
    'PENDING',
    'RUNNING',
    'COMPLETED',
    'FAILED',
    'CANCELLED'
);

CREATE TYPE step_status AS ENUM (
    'PENDING',
    'RUNNING',
    'COMPLETED',
    'FAILED',
    'RETRYING',
    'SKIPPED'
);

CREATE TYPE trigger_type AS ENUM (
    'manual',
    'cron',
    'event',
    'agent_call',
    'api',
    'webhook'
);

CREATE TYPE step_type AS ENUM (
    'llm',
    'tool',
    'agent_call',
    'condition',
    'input',
    'output',
    'memory',
    'transform'
);

CREATE TYPE event_type AS ENUM (
    'EXECUTION_CREATED',
    'EXECUTION_STARTED',
    'EXECUTION_COMPLETED',
    'EXECUTION_FAILED',
    'EXECUTION_CANCELLED',
    'EXECUTION_RETRY_PENDING',
    'STEP_STARTED',
    'STEP_COMPLETED',
    'STEP_FAILED',
    'STEP_SKIPPED',
    'AGENT_INVOKED',
    'AGENT_RESPONSE',
    'TRANSITION_EVALUATED',
    'RETRY_SCHEDULED',
    'LOCK_ACQUIRED',
    'LOCK_RELEASED',
    'STATE_UPDATED'
);

CREATE TYPE event_source AS ENUM (
    'executor',
    'orchestrator',
    'agent',
    'system',
    'scheduler'
);

CREATE TYPE lock_type AS ENUM (
    'execution',
    'step'
);