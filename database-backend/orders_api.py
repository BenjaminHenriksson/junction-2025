"""
API endpoint for orders from cleaned_data.csv
"""
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import csv
import os
import dotenv
from pathlib import Path
from datetime import datetime

dotenv.load_dotenv()

app = FastAPI(title="Orders API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load orders from CSV
orders_cache = None

def load_orders():
    """Load and sample orders from cleaned_data.csv"""
    global orders_cache
    if orders_cache is None:
        csv_path = Path(__file__).parent.parent / "stats-backend" / "cleaned_data.csv"
        orders_cache = []
        
        # Sample configuration
        SAMPLE_SIZE = 2000  # Total orders to sample
        FAILURE_SAMPLE_SIZE = 500  # Ensure we get enough failed orders
        ACTION_REQUIRED_SAMPLE_SIZE = 500  # Orders with partial delivery
        COMPLETED_SAMPLE_SIZE = 1000  # Completed orders
        
        print(f"Sampling orders from {csv_path}...")
        
        # First pass: collect all rows and categorize them
        all_rows = []
        failure_rows = []
        action_required_rows = []
        completed_rows = []
        
        with csv_path.open("r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for idx, row in enumerate(reader):
                try:
                    # Handle float values that might be in CSV
                    failure = int(float(row.get("failure", "0")))
                    delivered_qty = int(float(row.get("delivered_qty", "0")))
                    order_qty = int(float(row.get("order_qty", "0")))
                    
                    # Categorize the order
                    if failure == 1:
                        failure_rows.append((idx, row))
                    elif delivered_qty < order_qty:
                        action_required_rows.append((idx, row))
                    else:
                        completed_rows.append((idx, row))
                    
                    all_rows.append((idx, row))
                except Exception as e:
                    continue
        
        print(f"Found {len(failure_rows)} failures, {len(action_required_rows)} action required, {len(completed_rows)} completed")
        
        # Sample from each category
        import random
        random.seed(42)  # For reproducible sampling
        
        sampled_failures = random.sample(failure_rows, min(FAILURE_SAMPLE_SIZE, len(failure_rows)))
        sampled_action = random.sample(action_required_rows, min(ACTION_REQUIRED_SAMPLE_SIZE, len(action_required_rows)))
        sampled_completed = random.sample(completed_rows, min(COMPLETED_SAMPLE_SIZE, len(completed_rows)))
        
        # Combine and process sampled orders
        sampled_rows = sampled_failures + sampled_action + sampled_completed
        
        # Sort by order date for better ordering
        sampled_rows.sort(key=lambda x: x[1].get("order_created_date", ""))
        
        order_id_counter = 1
        for idx, row in sampled_rows:
            try:
                # Parse dates
                order_date = datetime.strptime(row["order_created_date"], "%Y-%m-%d")
                delivery_date = datetime.strptime(row["requested_delivery_date"], "%Y-%m-%d")
                
                # Determine status based on failure
                failure = int(float(row.get("failure", "0")))
                delivered_qty = int(float(row.get("delivered_qty", "0")))
                order_qty = int(float(row.get("order_qty", "0")))
                
                if failure == 1:
                    status = "support_required"
                elif delivered_qty < order_qty:
                    status = "action_required"
                else:
                    status = "completed"
                
                # Get product name from product code if possible
                product_code = row["product_code"]
                product_name = f"Product {product_code}"
                
                order = {
                    "id": str(order_id_counter),
                    "orderNumber": f"ORD-{product_code}-{order_id_counter:06d}",
                    "customer": f"Customer-{row['plant']}",
                    "destination": f"Plant {row['plant']}, Storage {row['storage_location']}",
                    "status": status,
                    "items": [{
                        "id": str(order_id_counter),
                        "name": product_name,
                        "quantity": order_qty,
                        "sku": product_code
                    }],
                    "totalValue": order_qty * 10,  # Mock value
                    "createdAt": order_date.isoformat(),
                    "product_code": product_code,
                    "order_qty": order_qty,
                    "sales_unit": row["sales_unit"],
                    "plant": str(row["plant"]),
                    "storage_location": str(row["storage_location"]),
                    "order_dow": row["order_dow"],
                    "delivery_dow": row["delivery_dow"],
                    "lead_time": int(float(row["lead_time"])),
                    "month": row["month"].split("-")[1] if "-" in row["month"] else row["month"],
                    "coinciding_delivery": str(row.get("coinciding_delivery", "0")),
                    "failure": failure,
                    "delivered_qty": delivered_qty,
                    "picking_picked_qty": int(float(row.get("picking_picked_qty", "0"))),
                }
                orders_cache.append(order)
                order_id_counter += 1
            except Exception as e:
                print(f"Error parsing row {idx + 1}: {e}")
                continue
        
        print(f"Sampled {len(orders_cache)} orders ({len(sampled_failures)} failures, {len(sampled_action)} action required, {len(sampled_completed)} completed)")
    
    return orders_cache

class OrderResponse(BaseModel):
    id: str
    orderNumber: str
    customer: str
    destination: str
    status: str
    items: List[dict]
    totalValue: float
    createdAt: str
    product_code: Optional[str] = None
    order_qty: Optional[int] = None
    sales_unit: Optional[str] = None
    plant: Optional[str] = None
    storage_location: Optional[str] = None
    order_dow: Optional[str] = None
    delivery_dow: Optional[str] = None
    lead_time: Optional[int] = None
    month: Optional[str] = None
    coinciding_delivery: Optional[str] = None
    failure: Optional[int] = None
    delivered_qty: Optional[int] = None
    picking_picked_qty: Optional[int] = None

@app.get("/")
def root():
    return {"message": "Orders API", "status": "ok"}

@app.get("/orders", response_model=List[OrderResponse])
def get_orders(
    limit: int = Query(100, ge=1, le=10000),
    offset: int = Query(0, ge=0),
    status: Optional[str] = Query(None, description="Filter by status")
):
    """Get list of orders"""
    orders = load_orders()
    
    # Filter by status if provided
    if status and status != "all":
        orders = [o for o in orders if o["status"] == status]
    
    # Apply pagination
    return orders[offset:offset+limit]

@app.get("/orders/count")
def get_orders_count(status: Optional[str] = Query(None)):
    """Get total number of orders"""
    orders = load_orders()
    if status and status != "all":
        orders = [o for o in orders if o["status"] == status]
    return {"count": len(orders)}

@app.get("/orders/{order_id}", response_model=OrderResponse)
def get_order(order_id: str):
    """Get a single order by ID"""
    # Don't match "count" as an order ID
    if order_id == "count":
        raise HTTPException(status_code=404, detail="Use /orders/count endpoint")
    
    orders = load_orders()
    try:
        idx = int(order_id) - 1
        if 0 <= idx < len(orders):
            return orders[idx]
    except:
        pass
    
    # Try to find by orderNumber
    for order in orders:
        if order["orderNumber"] == order_id or order["id"] == order_id:
            return order
    
    raise HTTPException(status_code=404, detail=f"Order {order_id} not found")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
