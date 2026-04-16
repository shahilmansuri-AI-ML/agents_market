from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from app.config.settings import settings


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
from app.middleware.tenant_middleware import TenantIsolationMiddleware

# Import routers
from app.routers import (
    auth,
    tenants,
    users,
    roles,
    invitations,
    api_keys,
    audit,
    admin,
    single_agents,
    multi_agents,
    workflow,
    tools,
    chat,
    super_admin,
    workspaces,
    public_api,
    deployment,
    execution,
    usage,
    profile,
    llm_models,
)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Multi-tenant AI Agent Orchestration Platform with IAM"
)

# Base.metadata.create_all(bind=engine)
# origins = [
#     "http://localhost:3000",
#     ]

# CORS FIRST
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# THEN custom middleware
app.add_middleware(TenantIsolationMiddleware)

# CORS middleware
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=settings.CORS_ORIGINS,
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# Tenant isolation middleware
# app.add_middleware(TenantIsolationMiddleware)

# Include authentication routers
app.include_router(auth.router)
app.include_router(super_admin.router)

# Include IAM routers
app.include_router(tenants.router)
app.include_router(users.router)
app.include_router(roles.router)
app.include_router(invitations.router)
app.include_router(api_keys.router)
app.include_router(audit.router)
app.include_router(admin.router)
app.include_router(workspaces.router)

# Include agent routers
app.include_router(single_agents.router)
app.include_router(multi_agents.router)
app.include_router(workflow.router)
app.include_router(tools.router)
app.include_router(chat.router)
app.include_router(deployment.router)
app.include_router(execution.router)
app.include_router(llm_models.router)

# Include public API router (Agent-as-API)
app.include_router(public_api.router)

# Include usage tracking and quota management
app.include_router(usage.router)

# Include profile management
app.include_router(profile.router)


@app.get("/")
def root():
    """Health check endpoint."""
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION
    }

