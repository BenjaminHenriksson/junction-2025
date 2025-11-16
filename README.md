# Valio Operations Dashboard

A full-stack application for managing product catalog, orders, and delivery operations with AI-powered similarity search and failure prediction.

## Quick Start

### One-Command Deployment

```bash
./deploy.sh
```

This will:
- ✅ Check all prerequisites
- ✅ Set up PostgreSQL database
- ✅ Create and populate product tables
- ✅ Install all dependencies
- ✅ Build the frontend
- ✅ Start all backend APIs
- ✅ Start the frontend

### Service Management

```bash
# Check status
./deploy.sh status

# Stop all services
./deploy.sh stop

# Restart all services
./deploy.sh restart
```

## Architecture

### Backend Services

1. **Product API** (Port 8000)
   - FastAPI server
   - Product catalog management
   - Vector similarity search using pgvector
   - Database-optimized queries

2. **Orders API** (Port 8002)
   - FastAPI server
   - Order management from CSV data
   - Order status tracking

3. **Stats API** (Port 8001)
   - R/Plumber server
   - XGBoost model for failure prediction
   - Order risk assessment

### Frontend

- React + TypeScript + Vite
- Port 3000 (development)
- Modern UI with shadcn/ui components

## Prerequisites

- Python 3.12+
- Node.js 20+
- PostgreSQL 12+ with pgvector extension
- R (optional, for Stats API)

## Configuration

Create `.env` file in project root:

```bash
DB_NAME=valio_product_catalog
DB_PASSWORD=your_postgres_password
GOOGLE_API_KEY=your_google_api_key
```

## Manual Setup

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed setup instructions.

## Project Structure

```
.
├── database-backend/     # Product API and Orders API
├── stats-backend/        # R/Plumber Stats API
├── frontend/             # React frontend
├── deploy.sh             # Main deployment script
└── DEPLOYMENT.md         # Detailed deployment guide
```

## Development

### Start Individual Services

```bash
# Product API
cd database-backend
./start_api.sh

# Orders API
cd database-backend
./start_orders_api.sh

# Stats API
cd stats-backend
./start_stats.sh

# Frontend
cd frontend
npm run dev
```

## Production Deployment

For production, use systemd services:

```bash
# Install systemd services
./deploy.sh install-systemd

# Enable and start
sudo systemctl enable product-api orders-api stats-api
sudo systemctl start product-api orders-api stats-api
```

## Troubleshooting

See:
- [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment troubleshooting
- [database-backend/TROUBLESHOOTING.md](database-backend/TROUBLESHOOTING.md) - Database issues
- [database-backend/QUICK_START.md](database-backend/QUICK_START.md) - Quick setup guide

## API Documentation

### Product API
- `GET /products` - List products
- `GET /products/{gtin}` - Get product details
- `GET /products/{gtin}/similar` - Find similar products
- `GET /search?q=query` - Search products

### Orders API
- `GET /orders` - List orders
- `GET /orders/{id}` - Get order details
- `GET /orders/count` - Get order count

### Stats API
- `GET /ping` - Health check
- `POST /predict` - Predict order failure risk

## License

[Add your license here]
