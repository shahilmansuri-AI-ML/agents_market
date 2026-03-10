-- Auto-update updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Executions
CREATE TRIGGER update_executions_updated_at
BEFORE UPDATE ON executions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Execution Steps
CREATE TRIGGER update_execution_steps_updated_at
BEFORE UPDATE ON execution_steps
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Execution State
CREATE TRIGGER update_execution_state_updated_at
BEFORE UPDATE ON execution_state
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
