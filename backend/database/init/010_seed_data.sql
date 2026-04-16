-- Seed default permissions
INSERT INTO permissions (name, description) VALUES
    ('tenant.manage', 'Manage tenant settings and configuration'),
    ('users.create', 'Create new users'),
    ('users.read', 'View user information'),
    ('users.update', 'Update user information'),
    ('users.delete', 'Delete users'),
    ('roles.assign', 'Assign roles to users'),
    ('roles.manage', 'Create and manage roles'),
    ('audit.view', 'View audit logs'),
    ('api_keys.create', 'Create API keys'),
    ('api_keys.delete', 'Delete API keys'),
    ('agents.create', 'Create AI agents'),
    ('agents.read', 'View AI agents'),
    ('agents.update', 'Update AI agents'),
    ('agents.delete', 'Delete AI agents'),
    ('tools.manage', 'Manage tools'),
    ('workflow.create', 'Create workflows'),
    ('workflow.execute', 'Execute workflows'),
    ('workflow.delete', 'Delete workflows'),
    ('invitations.send', 'Send invitations'),
    ('invitations.manage', 'Manage invitations')
ON CONFLICT (name) DO NOTHING;

-- -- Seed default tools
-- INSERT INTO tools (tool_name, tool_api) VALUES
--     ('Weather Tool', 'https://api.open-meteo.com/v1/forecast'),
--     ('Wikipedia Search Tool', 'https://en.wikipedia.org/api/rest_v1/page/summary/'),
--     ('Calculator Tool', 'internal://calculator'),
--     ('Currency Converter Tool', 'https://api.exchangerate.host/convert'),
--     ('News Tool', 'https://newsapi.org/v2/top-headlines')
-- ON CONFLICT (tool_name) DO NOTHING;
