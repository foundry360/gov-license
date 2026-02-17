# System Architecture

## Overview

This is an **Internal License Management System** for creating, storing, and tracking license keys. It operates independently with no connectivity to other systems.

## Components

### Internal License Management System (This Application)
- **Purpose**: Admin tool for creating and managing license keys
- **Database**: Supabase (PostgreSQL)
- **Location**: Production on Vercel (`https://gov-license-b63q.vercel.app/`)
- **Functions**:
  - Generate license keys
  - Store license data in Supabase
  - Track license renewals
  - Manage customer information
  - Update license status (active, inactive, revoked, expired)

### Control Plane Application (Separate System)
- **Purpose**: End-user application
- **Database**: PostgreSQL (Docker, localhost)
- **Location**: Localhost (separate application)
- **Functions**:
  - Validates license keys internally
  - Tracks 12-month expiration from activation
  - No connectivity to internal license system
  - Operates independently

## Key Points

- ✅ **No Connectivity**: The two systems are completely separate
- ✅ **No Syncing**: No data synchronization between systems
- ✅ **No Validation**: Control plane validates licenses internally
- ✅ **Independent Operation**: Each system operates on its own

## License Key Lifecycle

1. **Creation**: Admin creates license key in Internal License Management System
2. **Storage**: License stored in Supabase `vendor_api_keys` table
3. **Delivery**: License key delivered to customer (separate process)
4. **Validation**: Control plane validates license key internally
5. **Expiration**: Control plane tracks 12-month expiration from activation
6. **Renewal**: Tracked in Internal License Management System (separate from control plane)

## Database Schema

### Internal License System (Supabase)
- `licenses` - License records
- `vendor_api_keys` - License keys with API key hashes
- `customers` - Customer information

### Control Plane (PostgreSQL)
- `customer_accounts` - Customer account information
- `customer_api_keys` - License keys with activation tracking

## Status Values

License status can be:
- `active` - License is active
- `inactive` - License is inactive
- `revoked` - License has been revoked
- `expired` - License has expired

