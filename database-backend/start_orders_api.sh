#!/bin/bash
cd "$(dirname "$0")"
python -m uvicorn orders_api:app --host 0.0.0.0 --port 8002 --reload
