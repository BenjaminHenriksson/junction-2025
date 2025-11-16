# Quick Start - Populate Products Table

## Easiest Method: Use Venv Python

The project's virtual environment already has all dependencies. Use it directly:

```bash
cd /var/www/etymologer.com/database-backend
sudo -u postgres /var/www/etymologer.com/.venv/bin/python3 populate_products_table.py
```

Or use the wrapper script:
```bash
sudo -u postgres ./populate_products_table_postgres.sh
```

## Why This Works

- The venv has `psycopg` and `python-dotenv` already installed
- Running as `postgres` user allows peer authentication (no password needed)
- The script automatically tries peer auth if password auth fails

## Alternative: Install for System Python

If you prefer to use system Python:

```bash
# Install pip
sudo apt-get update
sudo apt-get install -y python3-pip

# Install dependencies
sudo python3 -m pip install psycopg[binary] python-dotenv

# Then run
sudo -u postgres python3 populate_products_table.py
```

## Verify It Worked

```bash
psql -U postgres -d valio_product_catalog -c "SELECT COUNT(*) FROM products;"
```

You should see the number of products inserted.
