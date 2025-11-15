from product_embedding import *
from pathlib import Path

product_data_path = Path("valio_aimo_product_data_junction_2025.json")

with product_data_path.open("r", encoding="utf-8") as f:
    product_data = json.load(f)

# Json.load returns a list of dictionaries

product_data = product_data[:10]

def main():

    for item in product_data:
        item = product(item)
        item.write_embedding_to_test_db()
        print(f"Embedding written to database for product {item.product_data['synkkaData']['gtin']}")

if __name__ == "__main__":
    main()
