
-- Executions
DROP TRIGGER IF EXISTS update_executions_updated_at ON executions;
CREATE TRIGGER update_executions_updated_at
BEFORE UPDATE ON executions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Execution Steps
DROP TRIGGER IF EXISTS update_execution_steps_updated_at ON execution_steps;
CREATE TRIGGER update_execution_steps_updated_at
BEFORE UPDATE ON execution_steps
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Execution State
DROP TRIGGER IF EXISTS update_execution_state_updated_at ON execution_state;
CREATE TRIGGER update_execution_state_updated_at
BEFORE UPDATE ON execution_state
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


