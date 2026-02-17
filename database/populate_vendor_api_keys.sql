-- Migration script to populate vendor_api_keys from existing licenses
-- This script creates vendor_api_keys entries for existing licenses
-- Run this AFTER creating the vendor_api_keys table

-- IMPORTANT: This requires generating the actual license keys to hash them
-- You may need to run this from your application code instead, as it requires
-- the JWT_SECRET to regenerate license keys

-- For now, this is a template. You'll need to:
-- 1. Generate the license key for each license (requires JWT_SECRET)
-- 2. Hash the license key with SHA256
-- 3. Insert into vendor_api_keys

-- Example: Populate vendor_api_keys from licenses (requires application code)
-- This SQL shows the structure, but actual population should be done via application

-- Option 1: If you have a way to generate license keys in SQL (unlikely)
-- You would need to call your license generation function here

-- Option 2: Use application code to populate
-- See the populate_vendor_api_keys.js script

-- For reference, here's what needs to happen for each license:
/*
INSERT INTO vendor_api_keys (
    license_id,
    api_key_hash,
    status,
    customer_code,
    customer_name,
    contact_email
)
SELECT 
    l.license_id,
    encode(digest(generate_license_key(l), 'sha256'), 'hex') as api_key_hash,
    l.status,
    l.customer_id as customer_code,
    c.company_name as customer_name,
    c.contact_email
FROM licenses l
LEFT JOIN customers c ON l.customer_id = c.customer_id
WHERE NOT EXISTS (
    SELECT 1 FROM vendor_api_keys v WHERE v.license_id = l.license_id
);
*/

-- Since license key generation requires JWT_SECRET (which shouldn't be in SQL),
-- use the Node.js script instead: database/populate_vendor_api_keys.js

