from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from db.database import engine, Base
from routers.tools import router as tools_router
from routers.single_agents import router as single_agents_router
from routers.multi_agents import router as multi_agents_router
from routers.agent_versions import router as agent_versions_router
from routers.agent_nodes import router as agent_nodes_router
from routers import workflow, single_agents, chat
from routers.tools import router as tools_router

app = FastAPI()

Base.metadata.create_all(bind=engine)

origins = [
    "http://localhost:3000",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
    
# correct routers
app.include_router(multi_agents_router)
app.include_router(agent_versions_router)
app.include_router(agent_nodes_router)
app.include_router(workflow.router)
app.include_router(single_agents.router)
app.include_router(chat.router)

app.include_router(tools_router)

@app.get("/")
def root():
    return {"status": "ok"}