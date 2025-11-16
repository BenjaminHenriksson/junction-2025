# Database Backend Setup

## Setup Products Database

1. Create the products table:
```bash
psql -U postgres -d valio_product_catalog -f create_products_table.sql
```

2. Populate the products table from JSON:
```bash
python populate_products_table.py
```

## Running the APIs

### Product API (Port 8000)
```bash
./start_api.sh
```

### Orders API (Port 8002)
```bash
./start_orders_api.sh
```

## API Endpoints

### Product API
- `GET /products` - List products (paginated)
- `GET /products/{gtin}` - Get product by GTIN
- `GET /products/{gtin}/similar` - Get similar products using vector search
- `GET /search?q=query` - Search products by name
- `GET /products/count` - Get total product count

### Orders API
- `GET /orders` - List orders (paginated, filterable by status)
- `GET /orders/{id}` - Get order by ID
- `GET /orders/count` - Get total order count
