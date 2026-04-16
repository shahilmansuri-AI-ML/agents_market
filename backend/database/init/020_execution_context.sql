-- =========================================================
-- EXECUTION CONTEXT
-- =========================================================

CREATE TABLE execution_context (
    execution_id UUID PRIMARY KEY
        REFERENCES executions(execution_id)
        ON DELETE CASCADE,

    context JSONB NOT NULL DEFAULT '{}',
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_execution_context_updated_at
BEFORE UPDATE ON execution_context
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();