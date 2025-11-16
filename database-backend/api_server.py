from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import json
import os
import dotenv
from pathlib import Path
import psycopg
import numpy as np
from product_embedding import product

dotenv.load_dotenv()

app = FastAPI(title="Product Database API")

# CORS middleware - Allow all origins in development
# In production, restrict to specific domains
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database connection
db_name = os.getenv("DB_NAME")
db_password = os.getenv("DB_PASSWORD")

# Remove quotes if present (common in .env files)
if db_name:
    db_name = db_name.strip('"\'')
if db_password:
    db_password = db_password.strip('"\'')

if not db_name or not db_password:
    print("WARNING: DB_NAME or DB_PASSWORD not set. Database features will not work.")

try:
    db_conn = psycopg.connect(
        f"dbname={db_name} user=postgres host=localhost password={db_password}",
        autocommit=True,
    )
    print(f"Database connection successful: {db_name}")
except Exception as e:
    print(f"WARNING: Database connection failed: {e}")
    print("API will use JSON fallback for product data.")
    db_conn = None

# Fallback: Load product data from JSON only when needed (for product_data field)
product_data_path = Path(__file__).parent / "valio_aimo_product_data_junction_2025.json"
product_data_cache = None

def load_product_data():
    """Lazy load product data only when needed for full product_data"""
    global product_data_cache
    if product_data_cache is None:
        print("Loading product data from JSON (fallback)...")
        try:
            with product_data_path.open("r", encoding="utf-8") as f:
                product_data_cache = json.load(f)
            print(f"Loaded {len(product_data_cache)} products")
        except Exception as e:
            print(f"Warning: Could not load product data from JSON: {e}")
            product_data_cache = []
    return product_data_cache

def get_product_by_gtin_from_json(gtin: str) -> Optional[dict]:
    """Find product by GTIN in JSON data (fallback)"""
    products = load_product_data()
    for prod in products:
        synkka = prod.get("synkkaData", {})
        if (prod.get("salesUnitGtin") == gtin or 
            synkka.get("gtin") == gtin or 
            prod.get("gtin") == gtin):
            return prod
    return None

def get_product_by_gtin_from_db(gtin: str) -> Optional[dict]:
    """Get product from database"""
    if not db_conn:
        return None
    try:
        with db_conn.cursor() as cur:
            cur.execute("SELECT product_data FROM products WHERE gtin = %s", (gtin,))
            result = cur.fetchone()
            if result:
                return json.loads(result[0])
    except Exception:
        return None
    return None

def get_product_by_gtin(gtin: str) -> Optional[dict]:
    """Get product by GTIN, try database first, then JSON fallback"""
    prod = get_product_by_gtin_from_db(gtin)
    if prod:
        return prod
    return get_product_by_gtin_from_json(gtin)

# Pydantic models
class SimilarProduct(BaseModel):
    gtin: str
    name: str
    similarity: float
    product_data: dict

class ProductResponse(BaseModel):
    gtin: str
    name: str
    product_data: dict

@app.get("/")
def root():
    return {"message": "Product Database API", "status": "ok"}

@app.get("/products", response_model=List[ProductResponse])
def get_products(
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0)
):
    """Get list of products from database"""
    # Try database first
    if db_conn:
        try:
            with db_conn.cursor() as cur:
                cur.execute("""
                    SELECT gtin, name, product_data 
                    FROM products 
                    ORDER BY gtin 
                    LIMIT %s OFFSET %s
                """, (limit, offset))
                
                results = cur.fetchall()
            
            products = []
            for gtin, name, product_data_json in results:
                try:
                    product_data = json.loads(product_data_json) if isinstance(product_data_json, str) else product_data_json
                    products.append(ProductResponse(
                        gtin=str(gtin),
                        name=name or "Unknown Product",
                        product_data=product_data
                    ))
                except Exception as e:
                    print(f"Error parsing product {gtin}: {e}")
                    continue
            
            if products:
                return products
        except Exception as e:
            print(f"Database query failed: {e}")
            # Fall through to JSON fallback
    
    # Fallback to JSON if database fails or is empty
    print("Using JSON fallback for products")
    products_data = load_product_data()
    products = []
    
    for prod in products_data[offset:offset+limit]:
        try:
            synkka = prod.get("synkkaData", {})
            gtin = (
                prod.get("salesUnitGtin") or 
                synkka.get("gtin") or 
                prod.get("gtin")
            )
            
            if not gtin:
                continue
            
            names = synkka.get("names", [])
            name = names[0].get("value", "Unknown Product") if names else "Unknown Product"
            
            products.append(ProductResponse(
                gtin=str(gtin),
                name=name,
                product_data=prod
            ))
        except Exception as e:
            print(f"Error processing product: {e}")
            continue
    
    return products

@app.get("/products/{gtin}", response_model=ProductResponse)
def get_product(gtin: str):
    """Get a single product by GTIN"""
    if db_conn:
        try:
            with db_conn.cursor() as cur:
                cur.execute("SELECT gtin, name, product_data FROM products WHERE gtin = %s", (gtin,))
                result = cur.fetchone()
                
                if result:
                    gtin_val, name, product_data_json = result
                    product_data = json.loads(product_data_json) if isinstance(product_data_json, str) else product_data_json
                    return ProductResponse(
                        gtin=str(gtin_val),
                        name=name or "Unknown Product",
                        product_data=product_data
                    )
        except Exception:
            pass  # Fall through to JSON fallback
    
    # Fallback to JSON
    prod = get_product_by_gtin_from_json(gtin)
    if not prod:
        raise HTTPException(status_code=404, detail=f"Product with GTIN {gtin} not found")
    
    synkka = prod.get("synkkaData", {})
    names = synkka.get("names", [])
    name = names[0].get("value", "Unknown Product") if names else "Unknown Product"
    
    return ProductResponse(
        gtin=gtin,
        name=name,
        product_data=prod
    )

@app.get("/products/{gtin}/similar", response_model=List[SimilarProduct])
def get_similar_products(
    gtin: str,
    limit: int = Query(10, ge=1, le=50)
):
    """Get similar products using vector similarity search"""
    # Get the product to find similar ones for
    prod = get_product_by_gtin(gtin)
    if not prod:
        raise HTTPException(status_code=404, detail=f"Product with GTIN {gtin} not found")
    
    # Create embedding for the product
    prod_obj = product(prod)
    embedding = prod_obj.get_embedding()
    
    # Query database for similar products
    if not db_conn:
        raise HTTPException(status_code=503, detail="Database connection not available for vector search")
    
    with db_conn.cursor() as cur:
        # Use cosine similarity - pgvector returns 1 - cosine_distance
        cur.execute("""
            SELECT 
                e.gtin,
                1 - (e.embedding <=> %s::vector) as similarity
            FROM embeddings e
            WHERE e.gtin != %s
            ORDER BY e.embedding <=> %s::vector
            LIMIT %s
        """, (embedding.tolist(), gtin, embedding.tolist(), limit))
        
        results = cur.fetchall()
    
    # Build response
    similar_products = []
    for result_gtin, similarity in results:
        similar_prod = get_product_by_gtin(str(result_gtin))
        if similar_prod:
            synkka = similar_prod.get("synkkaData", {})
            names = synkka.get("names", [])
            name = names[0].get("value", "Unknown Product") if names else "Unknown Product"
            
            similar_products.append(SimilarProduct(
                gtin=str(result_gtin),
                name=name,
                similarity=float(similarity),
                product_data=similar_prod
            ))
    
    return similar_products

@app.get("/search")
def search_products(
    q: str = Query(..., description="Search query"),
    limit: int = Query(20, ge=1, le=100)
):
    """Search products by name using database full-text search"""
    if db_conn:
        try:
            with db_conn.cursor() as cur:
                # Use PostgreSQL full-text search
                cur.execute("""
                    SELECT gtin, name, product_data
                    FROM products
                    WHERE to_tsvector('english', name) @@ plainto_tsquery('english', %s)
                       OR name ILIKE %s
                    ORDER BY ts_rank(to_tsvector('english', name), plainto_tsquery('english', %s)) DESC
                    LIMIT %s
                """, (q, f"%{q}%", q, limit))
                
                results = cur.fetchall()
            
            products = []
            for gtin, name, product_data_json in results:
                try:
                    product_data = json.loads(product_data_json) if isinstance(product_data_json, str) else product_data_json
                    products.append({
                        "gtin": str(gtin),
                        "name": name or "Unknown Product",
                        "product_data": product_data
                    })
                except Exception as e:
                    print(f"Error parsing product {gtin}: {e}")
                    continue
            
            return products
        except Exception:
            pass  # Fall through to JSON search
    
    # Fallback to JSON search
    products = load_product_data()
    query_lower = q.lower()
    
    results = []
    for prod in products:
        synkka = prod.get("synkkaData", {})
        gtin = (
            prod.get("salesUnitGtin") or 
            synkka.get("gtin") or 
            prod.get("gtin")
        )
        
        if not gtin:
            continue
        
        # Search in names
        names = synkka.get("names", [])
        for name_obj in names:
            name = name_obj.get("value", "")
            if query_lower in name.lower():
                results.append({
                    "gtin": str(gtin),
                    "name": name,
                    "product_data": prod
                })
                break
        
        if len(results) >= limit:
            break
    
    return results

@app.get("/products/count")
def get_products_count():
    """Get total number of products"""
    if db_conn:
        try:
            with db_conn.cursor() as cur:
                cur.execute("SELECT COUNT(*) FROM products")
                count = cur.fetchone()[0]
            return {"count": count}
        except Exception:
            pass
    
    # Fallback to JSON count
    products = load_product_data()
    return {"count": len(products)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
