import json, os, dotenv
dotenv.load_dotenv()

import numpy as np

from google import genai  
client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))
from google.genai import types

import psycopg
db_name = os.getenv("DB_NAME")
conn = psycopg.connect(
    f"dbname={db_name} user=postgres host=localhost password=qwerty"
)

class product:
    def __init__(self, product_data: dict):
        self.product_data = product_data
        #print(f"{product_data=}")
        self.embedding = None
    
    def create_embedding_string(self) -> str:
        vendorName = self.product_data["vendorName"]
        countryOfOrigin = self.product_data["countryOfOrigin"]
        name = self.product_data["synkkaData"]["names"][0]["value"]
        marketingText = self.product_data["synkkaData"]["marketingTexts"][0]["value"]
        keyIngredients = self.product_data["synkkaData"]["keyIngredients"][0]["value"]
        netWeight = self.product_data["synkkaData"]["unitConversions"][0]["netWeight"]["value"]

        allergens = [classification["values"] for classification in self.product_data["synkkaData"]["classifications"] if classification["name"] == "allergen"][0]

        if len(allergens) > 0:
            print(type(allergens))
            print(allergens)
            allergens_string = "; ".join([f"{allergen['id']}" for allergen in allergens])
        else:
            allergens_string = "No allergens."

        nutritionalClaims_matches = [
            classification["values"]
            for classification in self.product_data["synkkaData"]["classifications"]
            if classification["name"] == "nutritionalClaim"
        ]

        # `classification["values"]` is itself a list of dicts, so we need the first match's values
        if nutritionalClaims_matches:
            nutritionalClaims = nutritionalClaims_matches[0]
            nutritionalClaims_string = "; ".join(
                f"{nutritionalClaim['id']}".replace("_", " ").lower()
                for nutritionalClaim in nutritionalClaims
            )
        else:
            nutritionalClaims_string = "No nutritional claims."

        return f"Name: {name}; Net weight: {netWeight} kg; Marketing Text: {marketingText}; Vendor: {vendorName}; Country of Origin: {countryOfOrigin}; Key Ingredients: {keyIngredients}; Allergens: {allergens_string}; Nutritional Claims: {nutritionalClaims_string}."

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

        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO embeddings (gtin, embedding) VALUES (%s, %s)",
                    (self.product_data["synkkaData"]["gtin"], self.embedding.tolist())     # Important: convert numpy array → Python list
                )
        print(f"Embedding written to database for product {self.product_data['synkkaData']['gtin']}, with embedding: {self.embedding}")
