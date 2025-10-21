#!/bin/bash
# LinkedIn Accelerator Database Setup Script
# Handles PostgreSQL installation and database initialization for WSL/Linux

set -e  # Exit on error

echo "================================"
echo "LinkedIn Accelerator DB Setup"
echo "================================"
echo ""

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL client not found"
    echo "📦 Installing PostgreSQL..."
    sudo apt update
    sudo apt install -y postgresql postgresql-contrib
    echo "✅ PostgreSQL installed"
else
    echo "✅ PostgreSQL client found: $(psql --version)"
fi

# Check if PostgreSQL service is running
echo ""
echo "🔍 Checking PostgreSQL service status..."
if sudo service postgresql status | grep -q "online"; then
    echo "✅ PostgreSQL service is running"
else
    echo "🚀 Starting PostgreSQL service..."
    sudo service postgresql start
    sleep 2
    echo "✅ PostgreSQL service started"
fi

# Database configuration
DB_NAME="linkedin_accelerator_dev"
DB_USER="postgres"

echo ""
echo "📊 Creating database: $DB_NAME"

# Create database if it doesn't exist
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;"

echo "✅ Database created/verified: $DB_NAME"

# Run schema migration
echo ""
echo "📋 Running schema migration..."
sudo -u postgres psql -d $DB_NAME -f schema.sql
echo "✅ Schema migration completed"

# Run seed data
echo ""
echo "🌱 Running seed data..."
sudo -u postgres psql -d $DB_NAME -f seed.sql
echo "✅ Seed data loaded"

# Verify setup
echo ""
echo "🔍 Verifying database setup..."
TABLE_COUNT=$(sudo -u postgres psql -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
echo "✅ Found $TABLE_COUNT tables"

echo ""
echo "================================"
echo "✅ Database Setup Complete!"
echo "================================"
echo ""
echo "📝 Next steps:"
echo "1. Update your .env.local with:"
echo "   POSTGRES_URL=\"postgresql://localhost:5432/$DB_NAME\""
echo ""
echo "2. Restart your Next.js dev server:"
echo "   npm run dev"
echo ""
echo "3. Test the connection by visiting:"
echo "   http://localhost:3000/dashboard"
echo ""
echo "🔧 Useful commands:"
echo "   Connect to database: sudo -u postgres psql -d $DB_NAME"
echo "   List tables:        sudo -u postgres psql -d $DB_NAME -c '\\dt'"
echo "   View ventures:      sudo -u postgres psql -d $DB_NAME -c 'SELECT * FROM venture;'"
echo ""
