# Customers Table Information

## Table Structure

The `customers` table stores customer information and is linked to licenses through the `customer_id` field.

### Columns

| Column | Type | Description |
|--------|------|-------------|
| `customer_id` | VARCHAR(255) | Primary key - Unique customer identifier |
| `company_name` | VARCHAR(255) | Company or organization name |
| `contact_name` | VARCHAR(255) | Primary contact person name |
| `contact_email` | VARCHAR(255) | Contact email address |
| `contact_phone` | VARCHAR(50) | Contact phone number |
| `address` | TEXT | Street address |
| `city` | VARCHAR(100) | City |
| `state` | VARCHAR(100) | State or province |
| `country` | VARCHAR(100) | Country |
| `postal_code` | VARCHAR(20) | Postal/ZIP code |
| `notes` | TEXT | Additional notes about the customer |
| `status` | VARCHAR(50) | Customer status: active, inactive, or suspended |
| `created_at` | TIMESTAMPTZ | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

## Indexes

- `idx_customers_status` - For filtering by status
- `idx_customers_company_name` - For searching by company name
- `idx_customers_email` - For email lookups

## Relationship with Licenses

The `customer_id` field in the `licenses` table references `customers.customer_id`. 

**Note:** The foreign key constraint is commented out in the schema. You can enable it if you want to enforce referential integrity (customers must exist before licenses can be created).

## Usage Examples

### Insert a new customer
```sql
INSERT INTO customers (
    customer_id, 
    company_name, 
    contact_name, 
    contact_email,
    status
) VALUES (
    'CUST-001',
    'Acme Corporation',
    'John Doe',
    'john@acme.com',
    'active'
);
```

### Get customer with license count
```sql
SELECT 
    c.*,
    COUNT(l.license_id) as total_licenses,
    COUNT(CASE WHEN l.status = 'active' AND l.expires_at > NOW() THEN 1 END) as active_licenses
FROM customers c
LEFT JOIN licenses l ON c.customer_id = l.customer_id
GROUP BY c.customer_id;
```

### Update customer status
```sql
UPDATE customers 
SET status = 'inactive', updated_at = NOW()
WHERE customer_id = 'CUST-001';
```

## Next Steps

1. Run the updated schema.sql in Supabase
2. Create API endpoints to manage customers (CRUD operations)
3. Update the dashboard to show customer details
4. Add customer management UI pages


