"""
Populate the products table from the JSON file.
This creates a searchable database table for faster product queries.
"""
import json
import os
import dotenv
from pathlib import Path
import psycopg

# Load .env from parent directory
env_path = Path(__file__).parent.parent / ".env"
dotenv.load_dotenv(env_path)

db_name = os.getenv("DB_NAME")
db_password = os.getenv("DB_PASSWORD")

# Remove quotes if present (common in .env files)
if db_name:
    db_name = db_name.strip('"\'')
if db_password:
    db_password = db_password.strip('"\'')

if not db_name:
    raise ValueError("DB_NAME environment variable is not set. Please check your .env file.")
# Password is optional if using peer authentication

print(f"Connecting to database: {db_name}")

# Try password authentication first, then peer authentication
try:
    if db_password:
        conn = psycopg.connect(
            f"dbname={db_name} user=postgres host=localhost password={db_password}",
            autocommit=True,
        )
        print("Database connection successful (password authentication)!")
    else:
        raise ValueError("No password provided")
except (psycopg.OperationalError, ValueError) as e:
    # Try peer authentication (no password, works when running as postgres user)
    print(f"Password authentication failed, trying peer authentication...")
    try:
        conn = psycopg.connect(
            f"dbname={db_name} user=postgres",
            autocommit=True,
        )
        print("Database connection successful (peer authentication)!")
    except psycopg.OperationalError as e2:
        print(f"\nERROR: Failed to connect to database!")
        print(f"Database name: {db_name}")
        print(f"Password auth error: {e}")
        print(f"Peer auth error: {e2}")
        print("\nPlease check:")
        print("1. PostgreSQL is running: sudo systemctl status postgresql")
        print("2. Database exists: psql -U postgres -l")
        print("3. .env file has correct DB_NAME and DB_PASSWORD")
        print("4. Or run as postgres user: sudo -u postgres python3 populate_products_table.py")
        raise

def populate_products_table():
    product_data_path = Path(__file__).parent / "valio_aimo_product_data_junction_2025.json"
    
    print("Loading product data...")
    with product_data_path.open("r", encoding="utf-8") as f:
        product_data = json.load(f)
    
    print(f"Loaded {len(product_data)} products")
    print("Populating products table...")
    
    with conn.cursor() as cur:
        # Clear existing data
        cur.execute("TRUNCATE TABLE products")
        
        inserted = 0
        skipped = 0
        
        for idx, prod in enumerate(product_data):
            if (idx + 1) % 1000 == 0:
                print(f"Processed {idx + 1} / {len(product_data)} products...")
            
            synkka = prod.get("synkkaData", {})
            gtin = (
                prod.get("salesUnitGtin") or 
                synkka.get("gtin") or 
                prod.get("gtin")
            )
            
            if not gtin:
                skipped += 1
                continue
            
            # Get product name
            names = synkka.get("names", [])
            name = names[0].get("value", "Unknown Product") if names else "Unknown Product"
            
            try:
                cur.execute("""
                    INSERT INTO products (gtin, name, vendor_name, country_of_origin, category, brand, sales_unit, base_unit, product_data)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (gtin) DO UPDATE
                    SET name = EXCLUDED.name,
                        vendor_name = EXCLUDED.vendor_name,
                        country_of_origin = EXCLUDED.country_of_origin,
                        category = EXCLUDED.category,
                        brand = EXCLUDED.brand,
                        sales_unit = EXCLUDED.sales_unit,
                        base_unit = EXCLUDED.base_unit,
                        product_data = EXCLUDED.product_data
                """, (
                    gtin,
                    name,
                    prod.get("vendorName"),
                    prod.get("countryOfOrigin"),
                    prod.get("category"),
                    synkka.get("brand"),
                    prod.get("salesUnit"),
                    prod.get("baseUnit"),
                    json.dumps(prod)
                ))
                inserted += 1
            except Exception as e:
                print(f"Error inserting product {gtin}: {e}")
                skipped += 1
    
    print(f"\nDone! Inserted {inserted} products, skipped {skipped}")

if __name__ == "__main__":
    try:
        populate_products_table()
    except Exception as e:
        print(f"\nFatal error: {e}")
        import sys
        sys.exit(1)
