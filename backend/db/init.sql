-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

---

 -- TOOLS

CREATE TABLE IF NOT EXISTS tools (
tool_id SERIAL PRIMARY KEY,
tool_name VARCHAR(100) NOT NULL,
tool_api TEXT NOT NULL
);

INSERT INTO tools (tool_name, tool_api) VALUES
('Weather Tool','https://api.open-meteo.com/v1/forecast'),
('Wikipedia Search Tool','https://en.wikipedia.org/api/rest_v1/page/summary/'),
('Calculator Tool','internal://calculator'),
('Currency Converter Tool','https://api.exchangerate.host/convert'),
('News Tool','https://newsapi.org/v2/top-headlines');

---

 -- SINGLE AGENTS

CREATE TABLE IF NOT EXISTS single_agents (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
tenant_id VARCHAR(150) NOT NULL,
name TEXT NOT NULL,
description TEXT,
instruction TEXT NOT NULL,
tool_id INTEGER REFERENCES tools(tool_id)
);

---

 -- MULTI AGENTS

CREATE TABLE IF NOT EXISTS multi_agents (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
tenant_id VARCHAR(150) NOT NULL,
name VARCHAR(150) NOT NULL,
status VARCHAR(30) NOT NULL,
tags TEXT[]
);

---

 -- AGENT VERSIONS

CREATE TABLE IF NOT EXISTS agent_versions (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
multi_agent_id UUID REFERENCES multi_agents(id) ON DELETE CASCADE,
version VARCHAR(255) NOT NULL,
json_spec JSONB NOT NULL
);

---

 -- AGENT NODES

CREATE TABLE IF NOT EXISTS agent_nodes (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
agent_version_id UUID REFERENCES agent_versions(id) ON DELETE CASCADE,
type VARCHAR(50) NOT NULL,
config JSONB NOT NULL
);

---

 -- PERSONAS

CREATE TABLE IF NOT EXISTS personas (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
tenant_id VARCHAR(150) NOT NULL,
config_json JSONB NOT NULL
);

---

 -- PROMPTS

CREATE TABLE IF NOT EXISTS prompts (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
tenant_id VARCHAR(150) NOT NULL,
content TEXT NOT NULL,
tags TEXT[]
);

---

 -- WORKFLOWS

CREATE TABLE IF NOT EXISTS workflows (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
multi_agent_id UUID REFERENCES multi_agents(id) ON DELETE CASCADE,
nodes JSONB NOT NULL,
edges JSONB NOT NULL,
created_at TIMESTAMP DEFAULT NOW(),
updated_at TIMESTAMP DEFAULT NOW(),
UNIQUE(multi_agent_id)
);

---

 -- CONVERSATIONS

CREATE TABLE IF NOT EXISTS conversations (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
tenant_id VARCHAR(150) NOT NULL,
agent_id VARCHAR,
title TEXT DEFAULT 'New Chat',
created_at TIMESTAMP DEFAULT NOW()
);

---

 -- MESSAGES

CREATE TABLE IF NOT EXISTS messages (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
role VARCHAR(20) CHECK (role IN ('user','assistant')),
content TEXT NOT NULL,
created_at TIMESTAMP DEFAULT NOW()
);

---

-- FEEDBACK

CREATE TABLE IF NOT EXISTS feedbacks (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
agent_name VARCHAR(50) NOT NULL,
rating INTEGER CHECK (rating >=1 AND rating <=5),
comments TEXT,
created_at TIMESTAMP DEFAULT NOW()
);
