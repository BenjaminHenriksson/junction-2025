# Quick Deployment Guide

## Unified Deployment Script

A new unified deployment script `start-all-services.sh` has been created to reliably start all APIs with proper health checks and error handling.

## Usage

### Start All Services
```bash
cd /var/www/etymologer.com
./start-all-services.sh start
```

### Stop All Services
```bash
./start-all-services.sh stop
```

### Restart All Services
```bash
./start-all-services.sh restart
```

### Check Status
```bash
./start-all-services.sh status
```

### Start with Frontend
```bash
START_FRONTEND=true ./start-all-services.sh start
```

## What It Does

The script:
1. **Stops existing instances** - Kills any processes running on the API ports
2. **Starts Product API** (port 8000) - Product catalog and search
3. **Starts Orders API** (port 8002) - Order management
4. **Starts Stats API** (port 8001) - Failure prediction (requires R)
5. **Optional Frontend** - Development server (port 3000)

## Features

- ✅ **Health Checks** - Verifies each API is responding before continuing
- ✅ **Error Handling** - Shows detailed error messages if services fail to start
- ✅ **Port Management** - Automatically kills processes on ports before starting
- ✅ **PID Tracking** - Tracks process IDs for easy management
- ✅ **Logging** - All logs go to `/var/www/etymologer.com/logs/`

## Service Ports

- **Product API**: http://localhost:8000
- **Orders API**: http://localhost:8002
- **Stats API**: http://localhost:8001
- **Frontend**: http://localhost:3000 (if started)

## Troubleshooting

### Check Logs
```bash
tail -f /var/www/etymologer.com/logs/product_api.log
tail -f /var/www/etymologer.com/logs/orders_api.log
tail -f /var/www/etymologer.com/logs/stats_api.log
```

### Manual Start (if script fails)
```bash
# Product API
cd /var/www/etymologer.com/database-backend
/var/www/etymologer.com/.venv/bin/python3 -m uvicorn api_server:app --host 0.0.0.0 --port 8000

# Orders API
cd /var/www/etymologer.com/database-backend
/var/www/etymologer.com/.venv/bin/python3 -m uvicorn orders_api:app --host 0.0.0.0 --port 8002

# Stats API
cd /var/www/etymologer.com/stats-backend
bash start_stats.sh
```

## Requirements

- Python 3 with virtual environment at `/var/www/etymologer.com/.venv`
- R and Rscript (for Stats API)
- Node.js and npm (for Frontend, optional)

## Notes

- The script uses `set -euo pipefail` for strict error handling
- Services are started in the background using `nohup`
- PID files are stored in `/var/www/etymologer.com/.pids/`
- All logs are in `/var/www/etymologer.com/logs/`
