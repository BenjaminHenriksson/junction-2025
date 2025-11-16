# Database Connection Troubleshooting

## Issue: Password Authentication Failed

If you see `password authentication failed for user "postgres"`, try these steps:

### 1. Test Database Connection

Run the test script:
```bash
cd database-backend
python test_db_connection.py
```

### 2. Check PostgreSQL is Running

```bash
sudo systemctl status postgresql
```

If not running, start it:
```bash
sudo systemctl start postgresql
```

### 3. Verify Database Exists

```bash
psql -U postgres -l
```

Look for `valio_product_catalog` in the list.

### 4. Check PostgreSQL Authentication Method

PostgreSQL might be configured to use peer authentication instead of password authentication. Check:

```bash
sudo cat /etc/postgresql/*/main/pg_hba.conf | grep -v '^#' | grep -v '^$'
```

If you see `local all postgres peer` instead of `md5` or `scram-sha-256`, PostgreSQL is using peer authentication.

### 5. Solutions

#### Option A: Use Peer Authentication (Recommended for local development)

If PostgreSQL uses peer authentication, connect as the postgres user:

```bash
sudo -u postgres psql -d valio_product_catalog
```

Then create the products table:
```bash
\i create_products_table.sql
```

And run the populate script as postgres user or use sudo:
```bash
sudo -u postgres python populate_products_table.py
```

#### Option B: Change to Password Authentication

Edit `/etc/postgresql/*/main/pg_hba.conf`:
```
local   all             postgres                                md5
host    all             postgres        127.0.0.1/32            md5
```

Then restart PostgreSQL:
```bash
sudo systemctl restart postgresql
```

#### Option C: Set PostgreSQL Password

If you need to set/reset the postgres password:

```bash
sudo -u postgres psql
```

Then in psql:
```sql
ALTER USER postgres WITH PASSWORD 'your_new_password';
```

Update `.env` file with the new password.

### 6. Verify .env File

Check that `.env` file in the project root has:
```
DB_NAME=valio_product_catalog
DB_PASSWORD=your_password_here
```

Note: Remove quotes around values if present. The script will handle them, but it's cleaner without.

### 7. Test Connection Manually

Try connecting manually:
```bash
psql -U postgres -d valio_product_catalog -h localhost
```

If this works, the issue is with the Python script. If it doesn't, the issue is with PostgreSQL configuration.
