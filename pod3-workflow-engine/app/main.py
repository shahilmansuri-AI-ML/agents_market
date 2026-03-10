from fastapi import FastAPI, HTTPException
from sqlalchemy import text
from app.database import SessionLocal
from runtime.coordinator import Coordinator
from services.deployment_service import DeploymentService

import json
import uuid
import traceback
import threading

app = FastAPI(title="Pod-3 Workflow Execution Engine")

# Coordinator = Orchestration Engine
coordinator = Coordinator()
deployment_service = DeploymentService()


# API 1: REGISTER AGENT
# =====================================================
@app.post("/agents/register")
def register_agent(data: dict):

    session = SessionLocal()

    try:

        # --------------------------
        # Validate required fields
        # --------------------------
        required_fields = [
            "tenant_id",
            "agent_name",
            "system_prompt",
            "model_name",
            "workflow_definition"
        ]

        for field in required_fields:
            if field not in data:
                raise Exception(f"{field} is required")

        # --------------------------
        # Check duplicate agent
        # --------------------------
        existing = session.execute(
            text("""
            SELECT agent_id
            FROM agent_registry
            WHERE tenant_id = :tenant_id
            AND agent_name = :agent_name
            """),
            {
                "tenant_id": data["tenant_id"],
                "agent_name": data["agent_name"]
            }
        ).fetchone()

        if existing:
            raise Exception("Agent already exists for this tenant")

        # --------------------------
        # Insert agent
        # --------------------------
        result = session.execute(
            text("""
            INSERT INTO agent_registry (
                agent_id,
                tenant_id,
                agent_name,
                description,
                agent_type,
                agent_mode,
                execution_framework,
                system_prompt,
                model_name,
                workflow_definition,
                status,
                created_at,
                updated_at
            )
            VALUES (
                :agent_id,
                :tenant_id,
                :agent_name,
                :description,
                'no_code',
                'single_agent',
                :execution_framework,
                :system_prompt,
                :model_name,
                :workflow_definition,
                'DRAFT',
                NOW(),
                NOW()
            )
            RETURNING agent_id
            """),
                        {
                "agent_id": data["agent_id"],
                "tenant_id": data["tenant_id"],
                "agent_name": data["agent_name"],
                "description": data.get("description"),
                "execution_framework": data.get("execution_framework", "ollama"),
                "system_prompt": data["system_prompt"],
                "model_name": data["model_name"],
                "workflow_definition": json.dumps(data["workflow_definition"])
            }
        )

        agent_id = result.scalar()

        session.commit()

        print(f"Agent registered successfully: {agent_id}")

        return {
            "agent_id": str(agent_id),
            "status": "registered"
        }

    except Exception as e:

        session.rollback()

        print("Agent registration failed:", str(e))
        traceback.print_exc()

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

    finally:
        session.close()


# API 2: DEPLOYE AGENT
# =====================================================     
@app.post("/deployments/deploy-agent")
def deploy_agent(payload: dict):

    agent_id = payload["agent_id"]
    tenant_id = payload["tenant_id"]

    result = deployment_service.deploy_agent(
        agent_id,
        tenant_id
    )

    return result

# =====================================================  

@app.post("/executions")
def create_execution(payload: dict):

    session = SessionLocal()

    try:

        required = ["agent_id", "tenant_id", "message"]

        for r in required:
            if r not in payload:
                raise Exception(f"{r} is required")

        agent_id = payload["agent_id"]
        tenant_id = payload["tenant_id"]

        # Validate deployed agent
        agent = session.execute(
            text("""
            SELECT agent_id, execution_framework
            FROM agent_registry
            WHERE agent_id = :agent_id
            AND tenant_id = :tenant_id
            AND status = 'DEPLOYED'
            """),
            {
                "agent_id": agent_id,
                "tenant_id": tenant_id
            }
        ).mappings().first()

        if not agent:
            raise Exception("Agent not deployed")

        # Insert execution
        result = session.execute(
            text("""
            INSERT INTO executions (
                workflow_id,
                tenant_id,
                agent_id,
                trigger_type,
                status,
                input_payload,
                created_at
            )
            VALUES (
                :workflow_id,
                :tenant_id,
                :agent_id,
                'manual',
                'PENDING',
                :input_payload,
                NOW()
            )
            RETURNING execution_id
            """),
            {
                "workflow_id": "single_agent_workflow",
                "tenant_id": tenant_id,
                "agent_id": agent_id,
                "input_payload": json.dumps(payload)
            }
        )

        execution_id = result.scalar()

        session.commit()

        # Execute workflow
        threading.Thread(
    target=coordinator.execute,
    args=(str(execution_id),),
    daemon=True
).start()

        return {
            "execution_id": str(execution_id),
            "status": "completed",
            "output": result
        }

    except Exception as e:

        session.rollback()
        traceback.print_exc()

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

    finally:
        session.close()

# =====================================================

@app.get("/executions/{execution_id}")
def get_execution(execution_id: str):

    session = SessionLocal()

    try:

        result = session.execute(
            text("""
            SELECT
                execution_id,
                agent_id,
                tenant_id,
                status,
                input_payload,
                output_payload,
                created_at,
                completed_at
            FROM executions
            WHERE execution_id = :execution_id
            """),
            {"execution_id": execution_id}
        ).mappings().first()

        if not result:
            raise HTTPException(status_code=404, detail="Execution not found")

        return dict(result)

    finally:
        session.close()

# =====================================================
@app.get("/executions/{execution_id}/steps")
def get_execution_steps(execution_id: str):

    session = SessionLocal()

    try:

        steps = session.execute(
            text("""
            SELECT
                step_id,
                step_name,
                status,
                started_at,
                completed_at
            FROM execution_steps
            WHERE execution_id = :execution_id
            ORDER BY started_at
            """),
            {"execution_id": execution_id}
        ).mappings().all()

        return [dict(step) for step in steps]

    finally:
        session.close()
# =====================================================
@app.get("/executions/{execution_id}/events")
def get_execution_events(execution_id: str):

    session = SessionLocal()

    try:

        events = session.execute(
            text("""
            SELECT
                event_type,
                event_data,
                created_at
            FROM execution_events
            WHERE execution_id = :execution_id
            ORDER BY created_at
            """),
            {"execution_id": execution_id}
        ).mappings().all()

        return [dict(event) for event in events]

    finally:
        session.close()
# =====================================================




# API 3: EXECUTE AGENT
# =====================================================
@app.post("/execute/{agent_id}")
def execute(agent_id: str, payload: dict):

    session = SessionLocal()

    try:

        print("Execution request received")

        # Validate payload
        if "tenant_id" not in payload:
            raise Exception("tenant_id is required")

        tenant_id = payload["tenant_id"]

        # Validate deployed agent
        agent = session.execute(
            text("""
            SELECT agent_id, execution_framework, workflow_definition
            FROM agent_registry
            WHERE agent_id = :agent_id
            AND tenant_id = :tenant_id
            AND status = 'DEPLOYED'
            """),
            {
                "agent_id": agent_id,
                "tenant_id": tenant_id
            }
        ).mappings().first()

        if not agent:
            raise Exception("Agent not found or not deployed")

        # Insert execution
        result = session.execute(
            text("""
            INSERT INTO executions (
                workflow_id,
                tenant_id,
                agent_id,
                trigger_type,
                status,
                input_payload,
                created_at
            )
            VALUES (
                :workflow_id,
                :tenant_id,
                :agent_id,
                'manual',
                'PENDING',
                :input_payload,
                NOW()
            )
            RETURNING execution_id
            """),
            {
                "workflow_id": "single_agent_workflow",
                "tenant_id": tenant_id,
                "agent_id": agent_id,
                "input_payload": json.dumps(payload)
            }
        )

        execution_id = result.scalar()

        session.commit()

        print(f"Execution created: {execution_id}")

        # Call orchestration engine
        threading.Thread(
            target=coordinator.execute,
            args=(str(execution_id),),
            daemon=True
        ).start()

        print(f"Execution started: {execution_id}")

        return {
            "execution_id": str(execution_id),
            "status": "started",
        }

    except Exception as e:

        session.rollback()

        print("Execution failed:", str(e))
        traceback.print_exc()

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

    finally:

        session.close()


# =====================================================
@app.get("/agents/{agent_id}")
def get_agent(agent_id: str):

    session = SessionLocal()

    try:

        result = session.execute(
            text("""
            SELECT agent_id, status
            FROM agent_registry
            WHERE agent_id = :agent_id
            """),
            {"agent_id": agent_id}
        ).mappings().first()

        if not result:
            raise HTTPException(status_code=404, detail="Agent not found")

        return dict(result)

    finally:
        session.close()


# =====================================================
@app.get("/executions/{execution_id}/logs")
def get_execution_logs(execution_id: str):

    session = SessionLocal()

    try:

        logs = session.execute(
            text("""
            SELECT
                event_type,
                source,
                event_payload,
                created_at
            FROM execution_events
            WHERE execution_id = :execution_id
            ORDER BY created_at
            """),
            {"execution_id": execution_id}
        ).mappings().all()

        return [dict(log) for log in logs]

    finally:
        session.close()