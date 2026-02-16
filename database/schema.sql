-- License Management System Database Schema
-- Run this in your Supabase SQL Editor

-- Create licenses table
CREATE TABLE IF NOT EXISTS licenses (
    license_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id VARCHAR(255) NOT NULL,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    features JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked', 'suspended')),
    signature_hash VARCHAR(255),
    last_heartbeat TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on customer_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_licenses_customer_id ON licenses(customer_id);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_licenses_status ON licenses(status);

-- Create index on expires_at for expiration queries
CREATE INDEX IF NOT EXISTS idx_licenses_expires_at ON licenses(expires_at);

-- Enable Row Level Security (RLS)
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role to do everything
-- Note: In production, you should create more restrictive policies
-- Drop policy if it exists to avoid errors on re-run
DROP POLICY IF EXISTS "Service role can manage licenses" ON licenses;
CREATE POLICY "Service role can manage licenses"
ON licenses
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
    customer_id VARCHAR(255) PRIMARY KEY,
    company_name VARCHAR(255),
    contact_name VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    notes TEXT,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on customer status for filtering
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);

-- Create index on company_name for searching
CREATE INDEX IF NOT EXISTS idx_customers_company_name ON customers(company_name);

-- Create index on contact_email for lookups
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(contact_email);

-- Enable Row Level Security (RLS) for customers
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role to manage customers
-- Drop policy if it exists to avoid errors on re-run
DROP POLICY IF EXISTS "Service role can manage customers" ON customers;
CREATE POLICY "Service role can manage customers"
ON customers
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Add foreign key relationship (optional - for referential integrity)
-- Note: This requires customer_id to exist in customers before creating a license
-- ALTER TABLE licenses
-- ADD CONSTRAINT fk_licenses_customer_id
-- FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
-- ON DELETE RESTRICT;

