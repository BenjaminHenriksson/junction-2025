import json, os, dotenv
dotenv.load_dotenv()

import numpy as np

from google import genai  
client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))
from google.genai import types

import psycopg
db_name = os.getenv("DB_NAME")
db_password = os.getenv("DB_PASSWORD")

# Lazy connection - only connect when needed (for populate scripts)
# This allows the API server to import this module without requiring DB connection
conn = None

def get_db_connection():
    """Get database connection, creating it if needed"""
    global conn
    if conn is None:
        # Remove quotes if present
        if db_name:
            db_name_clean = db_name.strip('"\'')
        else:
            db_name_clean = None
        if db_password:
            db_password_clean = db_password.strip('"\'')
        else:
            db_password_clean = None
        
        if not db_name_clean or not db_password_clean:
            raise RuntimeError("DB_NAME and DB_PASSWORD must be set")
        
        # Try password auth first, then peer auth
        try:
            conn = psycopg.connect(
                f"dbname={db_name_clean} user=postgres host=localhost password={db_password_clean}",
                autocommit=True,
            )
        except Exception:
            # Try peer authentication (for sudo -u postgres)
            try:
                conn = psycopg.connect(
                    f"dbname={db_name_clean} user=postgres host=localhost",
                    autocommit=True,
                )
            except Exception as e:
                raise RuntimeError(f"Failed to connect to database: {e}")
    return conn

class product:
    def __init__(self, product_data: dict):
        self.product_data = product_data
        #print(f"{product_data=}")
        self.embedding = None
    
    def create_embedding_string(self) -> str:
        # Top-level fields – use .get so missing keys don't explode
        vendorName = self.product_data.get("vendorName")
        countryOfOrigin = self.product_data.get("countryOfOrigin")

        synkka = self.product_data.get("synkkaData", {})

        # Helper to safely get the first item's "value" from a list field
        def first_value(list_key: str):
            items = synkka.get(list_key) or []
            if not items:
                return None
            first = items[0]
            if isinstance(first, dict):
                return first.get("value")
            return None

        name = first_value("names")
        marketingText = first_value("marketingTexts")
        keyIngredients = first_value("keyIngredients")

        # Net weight is nested a bit differently
        unit_conversions = synkka.get("unitConversions") or []
        netWeight = None
        if unit_conversions:
            uc0 = unit_conversions[0]
            if isinstance(uc0, dict):
                net = uc0.get("netWeight") or {}
                if isinstance(net, dict):
                    netWeight = net.get("value")

        # Classifications can contain allergens and nutritional claims
        classifications = synkka.get("classifications") or []

        allergen_value_lists = [
            classification.get("values") or []
            for classification in classifications
            if classification.get("name") == "allergen"
        ]
        allergens = allergen_value_lists[0] if allergen_value_lists else []

        if allergens:
            print(type(allergens))
            print(allergens)
            allergens_string = "; ".join(allergen["id"] for allergen in allergens if "id" in allergen)
        else:
            allergens_string = None  # omit from embedding string if missing

        nutritionalClaims_matches = [
            classification.get("values") or []
            for classification in classifications
            if classification.get("name") == "nutritionalClaim"
        ]

        # `classification["values"]` is itself a list of dicts, so we need the first match's values
        if nutritionalClaims_matches:
            nutritionalClaims = nutritionalClaims_matches[0]
            nutritionalClaims_string = "; ".join(
                f"{nutritionalClaim['id']}".replace("_", " ").lower()
                for nutritionalClaim in nutritionalClaims
                if "id" in nutritionalClaim
            )
        else:
            nutritionalClaims_string = None  # omit from embedding string if missing

        # Build the embedding string only from fields that are actually present
        parts: list[str] = []

        if name:
            parts.append(f"Name: {name}")
        if netWeight is not None:
            parts.append(f"Net weight: {netWeight} kg")
        if marketingText:
            parts.append(f"Marketing Text: {marketingText}")
        if vendorName:
            parts.append(f"Vendor: {vendorName}")
        if countryOfOrigin:
            parts.append(f"Country of Origin: {countryOfOrigin}")
        if keyIngredients:
            parts.append(f"Key Ingredients: {keyIngredients}")
        if allergens_string:
            parts.append(f"Allergens: {allergens_string}")
        if nutritionalClaims_string:
            parts.append(f"Nutritional Claims: {nutritionalClaims_string}")

        return "; ".join(parts) + "."

    def get_embedding(self) -> list[float]:
        embedding_string = self.create_embedding_string()

        # Call Gemini embeddings API correctly: pass config as an object,
        # then read embeddings from the response.
        response = client.models.embed_content(
            model="gemini-embedding-001",
            contents=[embedding_string],
            config=types.EmbedContentConfig(output_dimensionality=1536),
        )

        # We pass a single string in `contents`, so take the first embedding.
        embeddings = [np.array(e.values) for e in response.embeddings]
        self.embedding = embeddings[0]
        return self.embedding

    def write_embedding_to_test_db(self) -> None:
        if self.embedding is None:
            self.get_embedding()

        # Safely resolve GTIN; prefer salesUnitGtin, fall back to Synkka GTINs
        synkka = self.product_data.get("synkkaData", {})
        gtin = (
            self.product_data.get("salesUnitGtin")
            or synkka.get("gtin")
            or self.product_data.get("gtin")
        )
        if not gtin:
            print("Skipping product with missing GTIN")
            return

        # Use a cursor context manager only; keep the shared connection open.
        db_conn = get_db_connection()
        with db_conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO embeddings (gtin, embedding)
                VALUES (%s, %s)
                ON CONFLICT (gtin) DO UPDATE
                    SET embedding = EXCLUDED.embedding
                """,
                (gtin, self.embedding.tolist()),  # Important: convert numpy array → Python list
            )
        print(f"Embedding written to database for product {gtin}, with embedding: {self.embedding}")
