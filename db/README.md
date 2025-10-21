# Database Setup Guide

## Quick Start (Local PostgreSQL)

### Option 1: Windows (using your existing SQL Server setup)

```powershell
# Install PostgreSQL on Windows
# Download from: https://www.postgresql.org/download/windows/

# Or use Chocolatey
choco install postgresql

# Start PostgreSQL service
net start postgresql-x64-15

# Create database
psql -U postgres
CREATE DATABASE linkedin_accelerator_dev;
\q
```

### Option 2: WSL/Linux

```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL
sudo service postgresql start

# Create database
sudo -u postgres psql
CREATE DATABASE linkedin_accelerator_dev;
\q
```

### Option 3: Railway (Recommended for Quick Setup)

1. Go to https://railway.app
2. Create new project → PostgreSQL
3. Copy the connection string
4. Update `.env.local`:
   ```
   POSTGRES_URL="postgresql://user:pass@host:port/dbname"
   ```

## Running Migrations

```bash
# From project root
cd db

# Run schema creation
psql $POSTGRES_URL -f schema.sql

# Run seed data
psql $POSTGRES_URL -f seed.sql
```

## Verify Setup

```bash
# Connect to database
psql $POSTGRES_URL

# List tables
\dt

# Check venture table
SELECT * FROM venture LIMIT 5;

# Check tools
SELECT * FROM tool ORDER BY category, tool_name;

# Exit
\q
```

## Update Environment Variables

Update `.env.local` with your actual connection string:

```env
# Replace with your actual PostgreSQL connection string
POSTGRES_URL="postgresql://localhost:5432/linkedin_accelerator_dev"

# Or Railway connection string
POSTGRES_URL="postgresql://postgres:password@containers-us-west-123.railway.app:5432/railway"
```

## Schema Overview

- **venture** - Professional ventures/projects
- **brand_guide** - Brand identity per venture
- **content_draft** - AI-generated content
- **prospect** - Network connections
- **outreach_record** - Outreach tracking
- **tool** - Tools/technologies (global)
- **capability** - User skills/capabilities

## Next Steps

After database setup:
1. Restart Next.js dev server to pick up new connection
2. Test API endpoints at http://localhost:3000/api/*
3. Create test data via the UI or API
4. Verify data persistence
