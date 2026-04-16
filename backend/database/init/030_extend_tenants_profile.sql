-- Extend tenants table with company profile fields
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS company_size VARCHAR(50),
ADD COLUMN IF NOT EXISTS website VARCHAR(255);
