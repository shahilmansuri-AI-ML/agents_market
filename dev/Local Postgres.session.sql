
-- CREATE TABLE single_agents (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     tenant_id varchar(150) NOT NULL,
--     name TEXT NOT NULL,
--     description TEXT,
--     instruction TEXT NOT NULL,
--     tool_id INTEGER NOT NULL REFERENCES tools(tool_id)
-- );

-- ALTER table single_agents add column instruction TEXT;

-- CREATE TABLE multi_agents (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     tenant_id VARCHAR(150) NOT NULL,
--     name VARCHAR(150) NOT NULL,
--     status VARCHAR(30) NOT NULL,
--     tags TEXT[]
-- );


-- select * from multi_agents;


-- CREATE TABLE agent_versions (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     multi_agent_id UUID NOT NULL REFERENCES multi_agents(id) ON DELETE CASCADE,
--     version VARCHAR(255) NOT NULL,
--     json_spec JSONB NOT NULL
-- );


-- CREATE TABLE agent_nodes (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     agent_version_id UUID NOT NULL REFERENCES agent_versions(id) ON DELETE CASCADE,
--     type VARCHAR(50) NOT NULL,
--     config JSONB NOT NULL
-- );


-- CREATE TABLE personas (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     tenant_id varchar(150) NOT NULL,
--     config_json JSONB NOT NULL
-- );

-- CREATE TABLE prompts (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     tenant_id varchar(150) NOT NULL,
--     content TEXT NOT NULL,
--     tags TEXT[]
-- );

-- CREATE TABLE tools (
--     tool_id SERIAL PRIMARY KEY,
--     tool_name VARCHAR(100) NOT NULL,
--     tool_api TEXT NOT NULL
-- );

-- INSERT INTO tools (tool_name, tool_api) VALUES
-- ('Weather Tool', 'https://api.open-meteo.com/v1/forecast'),
-- ('Wikipedia Search Tool', 'https://en.wikipedia.org/api/rest_v1/page/summary/'),
-- ('Calculator Tool', 'internal://calculator'),
-- ('Currency Converter Tool', 'https://api.exchangerate.host/convert'),
-- ('News Tool', 'https://newsapi.org/v2/top-headlines');

-- SELECT * FROM tools;

-- delete from tools where tool_name = "Dummy Products";

-- CREATE TABLE workflows (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     multi_agent_id UUID NOT NULL REFERENCES multi_agents(id) ON DELETE CASCADE,
--     nodes JSONB NOT NULL,
--     edges JSONB NOT NULL,
--     created_at TIMESTAMP DEFAULT NOW(),
--     updated_at TIMESTAMP DEFAULT NOW(),
--     UNIQUE(multi_agent_id)
-- );

-- SELECT * FROM workflows;







-- Disable foreign key checks temporarily
-- SET session_replication_role = 'replica';

-- Drop all tables if exist
-- DROP TABLE IF EXISTS workflows CASCADE;
-- DROP TABLE IF EXISTS agent_nodes CASCADE;
-- DROP TABLE IF EXISTS agent_versions CASCADE;
-- DROP TABLE IF EXISTS multi_agents CASCADE;
-- DROP TABLE IF EXISTS agents CASCADE;
-- DROP TABLE IF EXISTS single_agents CASCADE;
-- DROP TABLE IF EXISTS tools CASCADE;
-- DROP TABLE IF EXISTS personas CASCADE;
-- DROP TABLE IF EXISTS prompts CASCADE;

-- -- Enable foreign key checks back
-- SET session_replication_role = 'origin';


-- DROP SCHEMA public CASCADE;

-- CREATE SCHEMA public;


-- CREATE TABLE conversations (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     tenant_id VARCHAR(150) NOT NULL,
--     agent_id UUID NOT NULL REFERENCES single_agents(id) ON DELETE CASCADE,
--     title TEXT DEFAULT 'New Chat',
--     created_at TIMESTAMP DEFAULT NOW()
-- );


-- CREATE TABLE messages (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
--     role VARCHAR(20) CHECK (role IN ('user','assistant')),
--     content TEXT NOT NULL,
--     created_at TIMESTAMP DEFAULT NOW()
-- );

-- ALTER TABLE conversations
-- DROP CONSTRAINT conversations_agent_id_fkey;

-- ALTER TABLE conversations
-- ALTER COLUMN agent_id TYPE VARCHAR;


-- CREATE TABLE feedbacks (
--     id UUID primary key default gen_random_uuid(),
--     agent_name varchar(50) not null,
--     rating  integer not null check(rating >=1 and rating <=5),
--     comments text,
--     created_at timestamp
-- )


-- ALTER TABLE single_agents
-- ALTER COLUMN tenant_id TYPE UUID
-- USING tenant_id::uuid;

-- ALTER TABLE multi_agents
-- ALTER COLUMN tenant_id TYPE UUID
-- USING tenant_id::uuid;

-- ALTER TABLE personas
-- ALTER COLUMN tenant_id TYPE UUID
-- USING tenant_id::uuid;

-- ALTER TABLE prompts
-- ALTER COLUMN tenant_id TYPE UUID
-- USING tenant_id::uuid;

-- ALTER TABLE conversations
-- ALTER COLUMN tenant_id TYPE UUID
-- USING tenant_id::uuid;

-- ALTER TABLE conversations
-- ALTER COLUMN agent_id TYPE UUID
-- USING agent_id::uuid;