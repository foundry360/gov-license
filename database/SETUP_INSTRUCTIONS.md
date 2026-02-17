# Supabase Database Setup Instructions

## Step-by-Step Guide

### 1. Access Supabase SQL Editor

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/utfpfrqnqcqibnnayize
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query** button

### 2. Run the Schema

1. Open the file `database/schema.sql` from this project
2. Copy the entire contents of the file
3. Paste it into the Supabase SQL Editor
4. Click **Run** (or press `Ctrl+Enter`)

### 3. Verify Table Creation

After running the schema, verify the table was created:

1. Go to **Table Editor** in the left sidebar
2. You should see a table named `licenses`
3. Click on it to see the columns:
   - `license_id` (uuid, primary key)
   - `customer_id` (text)
   - `issued_at` (timestamptz)
   - `expires_at` (timestamptz)
   - `features` (jsonb)
   - `status` (text)
   - `signature_hash` (text)
   - `last_heartbeat` (timestamptz)
   - `created_at` (timestamptz)
   - `updated_at` (timestamptz)

### 4. Verify Indexes

The schema creates these indexes for performance:
- `idx_licenses_customer_id` - For customer lookups
- `idx_licenses_status` - For status filtering
- `idx_licenses_expires_at` - For expiration queries

### 5. Verify RLS Policies

The schema enables Row Level Security (RLS) and creates a policy for the service role.

## Table Structure

### licenses Table

| Column | Type | Description |
|--------|------|-------------|
| license_id | UUID | Primary key, auto-generated |
| customer_id | VARCHAR(255) | Customer identifier |
| issued_at | TIMESTAMPTZ | When license was issued |
| expires_at | TIMESTAMPTZ | Expiration date/time |
| features | JSONB | Array of enabled features |
| status | VARCHAR(50) | active, expired, revoked, or suspended |
| signature_hash | VARCHAR(255) | SHA256 hash of license data |
| last_heartbeat | TIMESTAMPTZ | Last validation timestamp |
| created_at | TIMESTAMPTZ | Record creation time |
| updated_at | TIMESTAMPTZ | Last update time |

## Troubleshooting

### "relation already exists" error
- The table already exists. This is fine - the `IF NOT EXISTS` clause prevents errors.
- You can drop and recreate if needed: `DROP TABLE IF EXISTS licenses CASCADE;`

### "permission denied" error
- Make sure you're using the SQL Editor (not the Table Editor)
- The service role has full access via the RLS policy

### Table not showing in Table Editor
- Refresh the page
- Check if there were any errors in the SQL Editor output

## Next Steps

After the table is created:
1. Test by generating a license through the web interface
2. Check the `licenses` table in Supabase to see the new record
3. The dashboard should now show real data

## Quick SQL to Test

You can test the table with this query:

```sql
-- Insert a test license
INSERT INTO licenses (customer_id, expires_at, features, status)
VALUES ('TEST-001', NOW() + INTERVAL '1 year', '["feature1", "feature2"]'::jsonb, 'active');

-- View all licenses
SELECT * FROM licenses;

-- Clean up test data
DELETE FROM licenses WHERE customer_id = 'TEST-001';
```


