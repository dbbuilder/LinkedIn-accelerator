# Database Setup Guide

## ⚡ Quick Setup Options

### Option 1: Railway (Recommended - No sudo required)

Railway provides free PostgreSQL hosting perfect for development.

1. **Create Railway Account**
   - Go to https://railway.app
   - Sign up with GitHub

2. **Create PostgreSQL Database**
   - Click "New Project"
   - Select "Provision PostgreSQL"
   - Wait for deployment (~30 seconds)

3. **Get Connection String**
   - Click on your PostgreSQL service
   - Go to "Connect" tab
   - Copy the "Postgres Connection URL"
   - It will look like: `postgresql://postgres:password@containers-us-west-123.railway.app:5432/railway`

4. **Update Environment Variables**
   ```bash
   # Edit .env.local
   POSTGRES_URL="your-railway-connection-string-here"
   ```

5. **Run Migrations**
   ```bash
   cd db
   psql "$POSTGRES_URL" -f schema.sql
   psql "$POSTGRES_URL" -f seed.sql
   ```

6. **Verify Setup**
   ```bash
   psql "$POSTGRES_URL" -c "\dt"
   ```

---

### Option 2: Local PostgreSQL (WSL/Linux)

#### Prerequisites
```bash
# Check if PostgreSQL is installed
psql --version

# If not installed:
sudo apt update
sudo apt install postgresql postgresql-contrib
```

#### Setup Steps

1. **Start PostgreSQL Service**
   ```bash
   sudo service postgresql start
   ```

2. **Create Database**
   ```bash
   sudo -u postgres psql -c "CREATE DATABASE linkedin_accelerator_dev;"
   ```

3. **Run Schema Migration**
   ```bash
   cd db
   sudo -u postgres psql -d linkedin_accelerator_dev -f schema.sql
   ```

4. **Run Seed Data**
   ```bash
   sudo -u postgres psql -d linkedin_accelerator_dev -f seed.sql
   ```

5. **Verify Setup**
   ```bash
   sudo -u postgres psql -d linkedin_accelerator_dev -c "\dt"
   ```

   You should see 6 tables:
   - venture
   - brand_guide
   - content_draft
   - prospect
   - tool
   - capability_score

6. **Update Environment Variables**
   ```bash
   # Edit .env.local
   POSTGRES_URL="postgresql://localhost:5432/linkedin_accelerator_dev"
   ```

---

### Option 3: Windows PostgreSQL

1. **Download PostgreSQL**
   - https://www.postgresql.org/download/windows/
   - Or use Chocolatey: `choco install postgresql`

2. **Start PostgreSQL Service**
   ```powershell
   net start postgresql-x64-16
   ```

3. **Create Database** (using pgAdmin or command line)
   ```powershell
   psql -U postgres
   CREATE DATABASE linkedin_accelerator_dev;
   \q
   ```

4. **Run Migrations**
   ```powershell
   cd db
   psql -U postgres -d linkedin_accelerator_dev -f schema.sql
   psql -U postgres -d linkedin_accelerator_dev -f seed.sql
   ```

5. **Update Environment Variables**
   ```env
   POSTGRES_URL="postgresql://postgres:yourpassword@localhost:5432/linkedin_accelerator_dev"
   ```

---

## 🔍 Verification Steps

After setup, verify everything works:

1. **Check Tables Created**
   ```bash
   psql "$POSTGRES_URL" -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public';"
   ```

2. **Check Seed Data**
   ```bash
   psql "$POSTGRES_URL" -c "SELECT COUNT(*) as tool_count FROM tool;"
   ```
   Should return 26 tools.

3. **Test from Next.js**
   - Start dev server: `npm run dev`
   - Visit: http://localhost:3000/dashboard
   - Sign in with Clerk
   - Try creating a new venture

---

## 🗄️ Database Schema Overview

The database includes these tables:

1. **venture** - Professional ventures/projects
   - Columns: id, clerk_id, venture_name, description, industry, created_at
   - Constraint: Unique (clerk_id, venture_name)

2. **brand_guide** - Brand guidelines per venture
   - Columns: id, venture_id, tone, audience, content_pillars, negative_keywords, posting_frequency, auto_approval_threshold, target_platforms
   - Constraint: Unique venture_id

3. **content_draft** - AI-generated content
   - Columns: id, clerk_id, venture_id, topic, original_text, edited_text, ai_confidence_score, status, scheduled_publish_at, hashtags, created_at, approved_at, published_at
   - Valid statuses: pending_validation, pending_review, approved, rejected, published

4. **prospect** - Network connections
   - Columns: id, clerk_id, venture_id, linkedin_url, name, title, company, profile_summary, followers_count, avg_post_likes, avg_post_comments, criticality_score, relevance_score, reach_score, proximity_score, reciprocity_score, gap_fill_score
   - Constraint: Unique linkedin_url

5. **tool** - Global tools/technologies reference
   - Columns: id, tool_name, category, official_url, created_at
   - Constraint: Unique tool_name

6. **capability_score** - User skill proficiency
   - Columns: id, clerk_id, tool_id, task_id, score, source, created_at, updated_at
   - Constraint: Unique (clerk_id, tool_id, task_id)
   - Valid sources: github_analysis, self_reported, engagement, manual

---

## 🛠️ Troubleshooting

### Connection Refused
```bash
# Check if PostgreSQL is running
sudo service postgresql status

# Start if not running
sudo service postgresql start
```

### Authentication Failed
```bash
# For local PostgreSQL, use sudo -u postgres
sudo -u postgres psql

# Or set password for postgres user
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'newpassword';"
```

### Tables Already Exist
The schema uses `CREATE TABLE IF NOT EXISTS` so it's safe to re-run. To start fresh:
```bash
# Drop all tables (WARNING: Deletes all data!)
psql "$POSTGRES_URL" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Then re-run migrations
psql "$POSTGRES_URL" -f schema.sql
psql "$POSTGRES_URL" -f seed.sql
```

### Vercel Postgres Connection
If using @vercel/postgres package, the connection string format should work automatically. The package handles pooling and connection management.

---

## 📝 Next Steps

After database setup:

1. ✅ Database schema created
2. ✅ Seed data loaded
3. ⏭️ Test API endpoints
4. ⏭️ Implement AI integration
5. ⏭️ Deploy to production

For AI integration setup, see `AI-ARCHITECTURE.md`.
