import argparse
import json
from pathlib import Path
from typing import Any, Dict

import ijson  # type: ignore[import-untyped]


MAX_ITEMS_FOR_SCHEMA = 2000  # how many items to sample when inferring schema
SAMPLE_ITEMS = 3  # how many full items to show as example data


def python_type_to_json_type(value: Any) -> str:
    if value is None:
        return "null"
    if isinstance(value, bool):
        return "boolean"
    if isinstance(value, (int, float)):
        return "number"
    if isinstance(value, str):
        return "string"
    if isinstance(value, list):
        return "array"
    if isinstance(value, dict):
        return "object"
    return type(value).__name__


def update_schema(node: Dict[str, Any], value: Any) -> None:
    """
    Incrementally update a schema node with the structure of `value`.
    """
    value_type = python_type_to_json_type(value)
    types = node.setdefault("types", set())
    types.add(value_type)

    if isinstance(value, dict):
        props: Dict[str, Dict[str, Any]] = node.setdefault("properties", {})
        for key, v in value.items():
            child = props.setdefault(key, {})
            update_schema(child, v)
    elif isinstance(value, list):
        items_schema: Dict[str, Any] = node.setdefault("items", {})
        for item in value:
            update_schema(items_schema, item)


def finalize_schema(node: Dict[str, Any]) -> Dict[str, Any]:
    """
    Convert internal schema structure (with Python sets) into a JSON-serializable dict.
    """
    result: Dict[str, Any] = {}

    if "types" in node:
        # sort types for stable output
        result["types"] = sorted(node["types"])

    if "properties" in node:
        result["properties"] = {
            key: finalize_schema(child) for key, child in node["properties"].items()
        }

    if "items" in node:
        result["items"] = finalize_schema(node["items"])

    return result


def detect_top_level_char(path: Path) -> str:
    """
    Peek at the first non-whitespace character in the file to guess the JSON structure.
    Returns one of: '[', '{', or '' (empty / unknown).
    """
    with path.open("rb") as f:
        while True:
            b = f.read(1)
            if not b:
                return ""
            if b in b" \t\r\n":
                continue
            try:
                return b.decode("ascii")
            except UnicodeDecodeError:
                return ""


def analyze_json_array_streaming(path: Path) -> None:
    """
    Analyze a large JSON file whose top-level structure is an array of objects.
    Uses ijson to stream elements without loading everything into memory.
    """
    schema_root: Dict[str, Any] = {}
    total_items = 0
    schema_sampled = 0
    samples = []

    with path.open("rb") as f:
        for obj in ijson.items(f, "item"):
            total_items += 1
            if schema_sampled < MAX_ITEMS_FOR_SCHEMA:
                update_schema(schema_root, obj)
                schema_sampled += 1
            if len(samples) < SAMPLE_ITEMS:
                samples.append(obj)

    print(f"File: {path}")
    print("Top-level: JSON array")
    print(f"Total items: {total_items}")
    print(f"Schema inferred from first {schema_sampled} items:\n")

    schema_json = finalize_schema(schema_root)
    print(json.dumps(schema_json, indent=2, ensure_ascii=False))

    if samples:
        print(f"\nSample items (first {len(samples)}):\n")
        print(json.dumps(samples, indent=2, ensure_ascii=False, default=str))


def analyze_json_generic(path: Path) -> None:
    """
    Fallback analysis for non-array JSON (object at top-level).
    Loads the structure once into memory and then inspects it.
    """
    with path.open("r", encoding="utf-8") as f:
        data = json.load(f)

    # Decide what to treat as "items"
    if isinstance(data, list):
        items = data
        description = "Top-level list"
    elif isinstance(data, dict):
        # Heuristic: look for a list under common keys
        for key in ("items", "data", "results", "rows"):
            if isinstance(data.get(key), list):
                items = data[key]
                description = f"Top-level object with list under key '{key}'"
                break
        else:
            # Treat the entire dict as a single item
            items = [data]
            description = "Single top-level object"
    else:
        items = [data]
        description = f"Single scalar value of type {type(data).__name__}"

    schema_root: Dict[str, Any] = {}
    total_items = 0
    schema_sampled = 0

    for item in items:
        total_items += 1
        if schema_sampled < MAX_ITEMS_FOR_SCHEMA:
            update_schema(schema_root, item)
            schema_sampled += 1

    print(f"File: {path}")
    print(description)
    print(f"Total items: {total_items}")
    print(f"Schema inferred from first {schema_sampled} items:\n")

    schema_json = finalize_schema(schema_root)
    print(json.dumps(schema_json, indent=2, ensure_ascii=False))

    samples = items[:SAMPLE_ITEMS]
    if samples:
        print(f"\nSample items (first {len(samples)}):\n")
        print(json.dumps(samples, indent=2, ensure_ascii=False, default=str))


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Inspect the schema and item count of a large JSON file."
    )
    parser.add_argument(
        "json_path",
        nargs="?",
        default="valio_aimo_product_data_junction_2025.json",
        help="Path to the JSON file (default: valio_aimo_product_data_junction_2025.json)",
    )
    args = parser.parse_args()

    path = Path(args.json_path)
    if not path.exists():
        raise SystemExit(f"JSON file not found: {path}")

    top = detect_top_level_char(path)
    if top == "[":
        analyze_json_array_streaming(path)
    else:
        # Fallback to generic loader for '{' or unknown structures
        analyze_json_generic(path)


if __name__ == "__main__":
    main()
