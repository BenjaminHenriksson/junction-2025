# Product Database Setup Guide

## Quick Start

### Option 1: Run as postgres user (Recommended if password auth fails)

```bash
cd database-backend
sudo -u postgres python3 populate_products_table.py
```

If `python3` command not found, use the wrapper script:
```bash
sudo -u postgres ./populate_products_table_postgres.sh
```

### Option 2: Run as regular user (if password authentication works)

```bash
cd database-backend
python populate_products_table.py
```

Or use the wrapper:
```bash
./populate_products_table.sh
```

## Prerequisites

1. **PostgreSQL must be running:**
   ```bash
   sudo systemctl status postgresql
   ```

2. **Database must exist:**
   ```bash
   psql -U postgres -l | grep valio_product_catalog
   ```
   
   If not, create it:
   ```bash
   psql -U postgres -c "CREATE DATABASE valio_product_catalog;"
   ```

3. **Products table must exist:**
   ```bash
   psql -U postgres -d valio_product_catalog -f create_products_table.sql
   ```

4. **Required Python packages:**
   - For regular user (venv): Already installed in `.venv`
   - For postgres user: May need to install system-wide
     ```bash
     sudo python3 -m pip install psycopg[binary] python-dotenv
     ```

## Troubleshooting

### "python: command not found" when using sudo -u postgres

Use `python3` instead:
```bash
sudo -u postgres python3 populate_products_table.py
```

### "psycopg not found" when running as postgres user

Install psycopg for system Python:
```bash
sudo python3 -m pip install psycopg[binary] python-dotenv
```

### "password authentication failed"

This usually means PostgreSQL is using peer authentication. Solutions:

1. **Use peer authentication (easiest):**
   ```bash
   sudo -u postgres python3 populate_products_table.py
   ```
   The script will automatically try peer auth if password auth fails.

2. **Or set PostgreSQL password:**
   ```bash
   sudo -u postgres psql
   ALTER USER postgres WITH PASSWORD 'your_password';
   ```
   Then update `.env` file.

### Check connection manually

Test database connection:
```bash
psql -U postgres -d valio_product_catalog
```

If this works, the script should work too (when run as postgres user).

## Verification

After running the script, verify data was inserted:

```bash
psql -U postgres -d valio_product_catalog -c "SELECT COUNT(*) FROM products;"
```

You should see a count of products inserted.
