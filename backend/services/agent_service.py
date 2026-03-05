from sqlalchemy import text
from fastapi import HTTPException
from utils.validators import validate_id

def create_agent(db, payload):
    validate_id(payload.id)

    version_id = f"{payload.id}_v1"

    try:
        db.execute(text("""
            INSERT INTO agents (id, tenant_id, name, status, tags)
            VALUES (:id, :tenant_id, :name, 'active', :tags)
        """), {
            "id": payload.id,
            "tenant_id": payload.tenant_id,
            "name": payload.name,
            "tags": payload.tags
        })

        db.execute(text("""
            INSERT INTO agent_versions (id, agent_id, version, json_spec)
            VALUES (:id, :agent_id, 1, :json_spec)
        """), {
            "id": version_id,
            "agent_id": payload.id,
            "json_spec": {
                "entry_node": payload.nodes[0].id,
                "nodes": [n.id for n in payload.nodes],
                "edges": payload.edges
            }
        })

        for node in payload.nodes:
            db.execute(text("""
                INSERT INTO agent_nodes (id, agent_version_id, type, config)
                VALUES (:id, :vid, :type, :config)
            """), {
                "id": node.id,
                "vid": version_id,
                "type": node.type,
                "config": node.config
            })

        db.commit()

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


def list_agents(db, tenant_id: str):
    result = db.execute(text("""
        SELECT a.id, a.name, a.status, a.tags, MAX(v.version) AS latest_version
        FROM agents a
        LEFT JOIN agent_versions v ON v.agent_id = a.id
        WHERE a.tenant_id = :tenant_id
        GROUP BY a.id
    """), {"tenant_id": tenant_id})

    return [
        {
            "id": r.id,
            "name": r.name,
            "status": r.status,
            "tags": r.tags,
            "latest_version": r.latest_version
        }
        for r in result
    ]


def create_version(db, agent_id: str, payload):
    validate_id(agent_id)

    latest = db.execute(text("""
        SELECT MAX(version) FROM agent_versions WHERE agent_id = :id
    """), {"id": agent_id}).scalar()

    if latest is None:
        raise HTTPException(status_code=404, detail="Agent not found")

    new_version = latest + 1
    version_id = f"{agent_id}_v{new_version}"

    try:
        db.execute(text("""
            INSERT INTO agent_versions (id, agent_id, version, json_spec)
            VALUES (:id, :agent_id, :version, :json_spec)
        """), {
            "id": version_id,
            "agent_id": agent_id,
            "version": new_version,
            "json_spec": {
                "entry_node": payload.nodes[0].id,
                "nodes": [n.id for n in payload.nodes],
                "edges": payload.edges
            }
        })

        for node in payload.nodes:
            db.execute(text("""
                INSERT INTO agent_nodes (id, agent_version_id, type, config)
                VALUES (:id, :vid, :type, :config)
            """), {
                "id": node.id,
                "vid": version_id,
                "type": node.type,
                "config": node.config
            })

        db.commit()

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


def clone_agent(db, payload):
    validate_id(payload.source_agent_id)
    validate_id(payload.new_agent_id)

    source = db.execute(text("""
        SELECT * FROM agents WHERE id = :id
    """), {"id": payload.source_agent_id}).fetchone()

    if not source:
        raise HTTPException(status_code=404, detail="Source agent not found")

    latest_version = db.execute(text("""
        SELECT * FROM agent_versions
        WHERE agent_id = :id
        ORDER BY version DESC
        LIMIT 1
    """), {"id": payload.source_agent_id}).fetchone()

    nodes = db.execute(text("""
        SELECT * FROM agent_nodes WHERE agent_version_id = :vid
    """), {"vid": latest_version.id}).fetchall()

    try:
        db.execute(text("""
            INSERT INTO agents (id, tenant_id, name, status, tags)
            VALUES (:id, :tenant_id, :name, :status, :tags)
        """), {
            "id": payload.new_agent_id,
            "tenant_id": source.tenant_id,
            "name": f"{source.name} (Copy)",
            "status": source.status,
            "tags": source.tags
        })

        new_version_id = f"{payload.new_agent_id}_v1"

        db.execute(text("""
            INSERT INTO agent_versions (id, agent_id, version, json_spec)
            VALUES (:id, :agent_id, 1, :json_spec)
        """), {
            "id": new_version_id,
            "agent_id": payload.new_agent_id,
            "json_spec": latest_version.json_spec
        })

        for node in nodes:
            db.execute(text("""
                INSERT INTO agent_nodes (id, agent_version_id, type, config)
                VALUES (:id, :vid, :type, :config)
            """), {
                "id": node.id,
                "vid": new_version_id,
                "type": node.type,
                "config": node.config
            })

        db.commit()

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
