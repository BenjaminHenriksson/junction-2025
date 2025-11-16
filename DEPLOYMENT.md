# Deployment Guide

## Quick Start

Deploy everything with one command:

```bash
./deploy.sh
```

This will:
1. Check prerequisites
2. Set up the database (create tables, populate products)
3. Install dependencies
4. Build the frontend
5. Start all backend APIs
6. Start the frontend

## Commands

### Deploy/Start Services
```bash
./deploy.sh          # Full deployment
./deploy.sh deploy   # Same as above
./deploy.sh start    # Same as above
```

### Stop Services
```bash
./deploy.sh stop
```

### Restart Services
```bash
./deploy.sh restart
```

### Check Status
```bash
./deploy.sh status
```

## Environment Variables

Create a `.env` file in the project root:

```bash
DB_NAME=valio_product_catalog
DB_PASSWORD=your_postgres_password
GOOGLE_API_KEY=your_google_api_key
```

## Prerequisites

The script checks for:
- Python 3
- Node.js and npm
- PostgreSQL (psql)
- R (for Stats API - optional)

Install missing dependencies:

```bash
# Python (usually pre-installed)
sudo apt-get install -y python3 python3-venv python3-pip

# Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib

# R (for Stats API)
sudo apt-get install -y r-base
```

## Manual Steps (if needed)

### 1. Create Virtual Environment
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -e .
```

### 2. Install Frontend Dependencies
```bash
cd frontend
npm install
```

### 3. Database Setup
```bash
# Create database
sudo -u postgres psql -c "CREATE DATABASE valio_product_catalog;"

# Run SQL scripts
sudo -u postgres psql -d valio_product_catalog -f database-backend/create_db.sql
sudo -u postgres psql -d valio_product_catalog -f database-backend/create_products_table.sql

# Populate products
sudo -u postgres .venv/bin/python3 database-backend/populate_products_table.py
```

## Service URLs

After deployment, services are available at:

- **Frontend**: http://localhost:3000
- **Product API**: http://localhost:8000
- **Orders API**: http://localhost:8002
- **Stats API**: http://localhost:8001

## Logs

All service logs are in `logs/` directory:

- `logs/product_api.log`
- `logs/orders_api.log`
- `logs/stats_api.log`
- `logs/frontend.log`

## Troubleshooting

### Port Already in Use

If a port is already in use, stop the service first:

```bash
./deploy.sh stop
./deploy.sh
```

Or manually kill the process:

```bash
lsof -ti:8000 | xargs kill -9
```

### Database Connection Issues

Check PostgreSQL is running:

```bash
sudo systemctl status postgresql
```

Test connection:

```bash
psql -U postgres -d valio_product_catalog
```

### Frontend Build Fails

Clear node_modules and rebuild:

```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Python Dependencies Missing

Reinstall:

```bash
source .venv/bin/activate
pip install -e .
```

## Production Deployment

For production, consider:

1. **Use a process manager** (PM2, systemd, supervisor)
2. **Set up reverse proxy** (nginx) for frontend
3. **Use environment-specific configs**
4. **Set up monitoring and logging**
5. **Configure SSL/TLS certificates**
6. **Set up database backups**

Example systemd service:

```ini
[Unit]
Description=Product API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/etymologer.com/database-backend
ExecStart=/var/www/etymologer.com/.venv/bin/python3 -m uvicorn api_server:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

## Skip Options

Skip database setup:
```bash
SKIP_DB=true ./deploy.sh
```

Skip frontend build:
```bash
SKIP_BUILD=true ./deploy.sh
```

## Health Checks

Check if services are responding:

```bash
# Product API
curl http://localhost:8000/

# Orders API
curl http://localhost:8002/

# Stats API
curl http://localhost:8001/ping

# Frontend
curl http://localhost:3000/
```
