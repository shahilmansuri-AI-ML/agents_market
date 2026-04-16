-- Sample tenants for testing super admin functionality
INSERT INTO tenants (id, name, description, domain, status, created_at, updated_at) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'Acme Corporation', 'Technology solutions provider', 'acme.com', 'active', NOW(), NOW()),
    ('550e8400-e29b-41d4-a716-446655440002', 'Global Industries', 'Manufacturing and logistics', 'global.com', 'active', NOW(), NOW()),
    ('550e8400-e29b-41d4-a716-446655440003', 'Tech Startup Inc', 'Innovative software development', 'techstartup.com', 'active', NOW(), NOW()),
    ('550e8400-e29b-41d4-a716-446655440004', 'Digital Agency', 'Creative marketing solutions', 'digital.com', 'suspended', NOW(), NOW());