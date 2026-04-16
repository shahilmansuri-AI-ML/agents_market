from enum import Enum


# =========================================================
# EXECUTION LIFECYCLE
# =========================================================

class ExecutionStatus(str, Enum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


# =========================================================
# STEP LIFECYCLE
# =========================================================

class StepStatus(str, Enum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    RETRYING = "RETRYING"
    SKIPPED = "SKIPPED"


# =========================================================
# EXECUTION TRIGGER TYPES
# =========================================================

class TriggerType(str, Enum):
    MANUAL = "manual"
    CRON = "cron"
    EVENT = "event"
    AGENT_CALL = "agent_call"
    API = "api"
    WEBHOOK = "webhook"


# =========================================================
# EXECUTION EVENT TYPES
# =========================================================

class EventType(str, Enum):
    EXECUTION_CREATED = "EXECUTION_CREATED"
    EXECUTION_STARTED = "EXECUTION_STARTED"
    EXECUTION_COMPLETED = "EXECUTION_COMPLETED"
    EXECUTION_FAILED = "EXECUTION_FAILED"
    EXECUTION_CANCELLED = "EXECUTION_CANCELLED"
    EXECUTION_RETRY_PENDING = "EXECUTION_RETRY_PENDING"

    STEP_STARTED = "STEP_STARTED"
    STEP_COMPLETED = "STEP_COMPLETED"
    STEP_FAILED = "STEP_FAILED"
    STEP_SKIPPED = "STEP_SKIPPED"

    AGENT_INVOKED = "AGENT_INVOKED"
    AGENT_RESPONSE = "AGENT_RESPONSE"

    TOOL_INVOKED = "TOOL_INVOKED"
    TOOL_RESPONSE = "TOOL_RESPONSE"

    TRANSITION_EVALUATED = "TRANSITION_EVALUATED"
    RETRY_SCHEDULED = "RETRY_SCHEDULED"

    LOCK_ACQUIRED = "LOCK_ACQUIRED"
    LOCK_RELEASED = "LOCK_RELEASED"

    STATE_UPDATED = "STATE_UPDATED"
    PREVIEW_EXECUTED = "PREVIEW_EXECUTED"


# =========================================================
# EVENT SOURCES
# =========================================================

class EventSource(str, Enum):
    EXECUTOR = "executor"
    ORCHESTRATOR = "orchestrator"
    AGENT = "agent"
    TOOL = "tool"
    SYSTEM = "system"
    SCHEDULER = "scheduler"
    PREVIEW = "preview"


# =========================================================
# LOCK TYPES
# =========================================================

class LockType(str, Enum):
    EXECUTION = "execution"
    STEP = "step"


# =========================================================
# RUNTIME PROVIDERS
# =========================================================

class RuntimeProvider(str, Enum):
    INTERNAL = "internal"
    LANGGRAPH = "langgraph"
    CREWAI = "crewai"
    STRANDS = "strands"
    ADK = "adk"


# =========================================================
# DEPLOYMENT STATUS
# =========================================================

class DeploymentStatus(str, Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    FAILED = "FAILED"
    ROLLBACK = "ROLLBACK"


# =========================================================
# DEPLOYMENT TYPE
# =========================================================

class DeploymentType(str, Enum):
    MANUAL = "manual"
    AUTO = "auto"
    ROLLBACK = "rollback"
    REDEPLOY = "redeploy"