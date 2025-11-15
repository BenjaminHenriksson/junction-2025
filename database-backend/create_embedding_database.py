from product_embedding import *
from pathlib import Path
import time

print("Loading product data...")
product_data_path = Path("valio_aimo_product_data_junction_2025.json")

print("Parsing JSON...")
with product_data_path.open("r", encoding="utf-8") as f:
    product_data = json.load(f)

# Truncate product data to 10 items for testing
#product_data = product_data[:10]

# Json.load returns a list of dictionaries
print("Loaded product data")

def main():
    start_time = time.time()

    for idx, item in enumerate(product_data):
        processed = idx + 1
        total = len(product_data)

        elapsed = time.time() - start_time
        avg_per_item = elapsed / processed
        remaining = total - processed
        eta_seconds = remaining * avg_per_item

        print(f"Processing item {processed} of {total} (estimated time left: {eta_seconds:,.1f}s)")
        
        item = product(item)
        item.write_embedding_to_test_db()

        synkka = item.product_data.get("synkkaData", {})
        gtin = (
            item.product_data.get("salesUnitGtin")
            or synkka.get("gtin")
            or item.product_data.get("gtin")
        )
        if gtin:
            print(f"Embedding written to database for product {gtin}")
        else:
            print("Skipping product with missing GTIN.")

if __name__ == "__main__":
    if input("Are you sure you want to write the embeddings to the database? (y/n): ") == "y":
        main()
    else:
        print("Exiting...")
