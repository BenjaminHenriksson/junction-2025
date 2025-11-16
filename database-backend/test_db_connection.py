#!/usr/bin/env python3
"""
Test database connection to help debug connection issues
"""
import os
import dotenv
from pathlib import Path
import psycopg

# Load .env from parent directory
env_path = Path(__file__).parent.parent / ".env"
dotenv.load_dotenv(env_path)

db_name = os.getenv("DB_NAME")
db_password = os.getenv("DB_PASSWORD")

# Remove quotes if present
if db_name:
    db_name = db_name.strip('"\'')
if db_password:
    db_password = db_password.strip('"\'')

print(f"Testing connection to database: {db_name}")
print(f"Password length: {len(db_password) if db_password else 0} characters")

if not db_name:
    print("ERROR: DB_NAME not set")
    exit(1)
if not db_password:
    print("ERROR: DB_PASSWORD not set")
    exit(1)

try:
    print("\nAttempting connection...")
    conn = psycopg.connect(
        f"dbname={db_name} user=postgres host=localhost password={db_password}",
        connect_timeout=5
    )
    print("✓ Connection successful!")
    
    with conn.cursor() as cur:
        cur.execute("SELECT version();")
        version = cur.fetchone()[0]
        print(f"\nPostgreSQL version: {version}")
        
        cur.execute("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
        table_count = cur.fetchone()[0]
        print(f"Tables in database: {table_count}")
        
        # Check if products table exists
        cur.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'products'
            );
        """)
        products_exists = cur.fetchone()[0]
        print(f"Products table exists: {products_exists}")
        
        if products_exists:
            cur.execute("SELECT COUNT(*) FROM products;")
            product_count = cur.fetchone()[0]
            print(f"Products in table: {product_count}")
    
    conn.close()
    print("\n✓ All checks passed!")
    
except psycopg.OperationalError as e:
    print(f"\n✗ Connection failed!")
    print(f"Error: {e}")
    print("\nTroubleshooting steps:")
    print("1. Check PostgreSQL is running:")
    print("   sudo systemctl status postgresql")
    print("\n2. Try connecting manually:")
    print(f"   psql -U postgres -d {db_name}")
    print("\n3. Check PostgreSQL authentication config:")
    print("   sudo cat /etc/postgresql/*/main/pg_hba.conf | grep -v '^#' | grep -v '^$'")
    print("\n4. If using peer authentication, try:")
    print("   sudo -u postgres psql -d valio_product_catalog")
    exit(1)
except Exception as e:
    print(f"\n✗ Unexpected error: {e}")
    exit(1)
