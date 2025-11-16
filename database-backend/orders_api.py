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
    """Load orders from cleaned_data.csv"""
    global orders_cache
    if orders_cache is None:
        csv_path = Path(__file__).parent.parent / "stats-backend" / "cleaned_data.csv"
        orders_cache = []
        
        print(f"Loading orders from {csv_path}...")
        with csv_path.open("r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for idx, row in enumerate(reader):
                try:
                    # Parse dates
                    order_date = datetime.strptime(row["order_created_date"], "%Y-%m-%d")
                    delivery_date = datetime.strptime(row["requested_delivery_date"], "%Y-%m-%d")
                    
                    # Determine status based on failure
                    failure = int(row.get("failure", "0"))
                    if failure == 1:
                        status = "support_required"
                    elif int(row.get("delivered_qty", "0")) < int(row.get("order_qty", "0")):
                        status = "action_required"
                    else:
                        status = "completed"
                    
                    order = {
                        "id": str(idx + 1),
                        "orderNumber": f"ORD-{row['product_code']}-{idx + 1:06d}",
                        "customer": f"Customer-{row['plant']}",
                        "destination": f"Plant {row['plant']}, Storage {row['storage_location']}",
                        "status": status,
                        "items": [{
                            "id": str(idx + 1),
                            "name": f"Product {row['product_code']}",
                            "quantity": int(row["order_qty"]),
                            "sku": row["product_code"]
                        }],
                        "totalValue": int(row["order_qty"]) * 10,  # Mock value
                        "createdAt": order_date.isoformat(),
                        "product_code": row["product_code"],
                        "order_qty": int(row["order_qty"]),
                        "sales_unit": row["sales_unit"],
                        "plant": str(row["plant"]),
                        "storage_location": str(row["storage_location"]),
                        "order_dow": row["order_dow"],
                        "delivery_dow": row["delivery_dow"],
                        "lead_time": int(row["lead_time"]),
                        "month": row["month"].split("-")[1] if "-" in row["month"] else row["month"],
                        "coinciding_delivery": str(row.get("coinciding_delivery", "0")),
                        "failure": failure,
                        "delivered_qty": int(row.get("delivered_qty", "0")),
                        "picking_picked_qty": int(row.get("picking_picked_qty", "0")),
                    }
                    orders_cache.append(order)
                except Exception as e:
                    print(f"Error parsing row {idx + 1}: {e}")
                    continue
        
        print(f"Loaded {len(orders_cache)} orders")
    
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

@app.get("/orders/{order_id}", response_model=OrderResponse)
def get_order(order_id: str):
    """Get a single order by ID"""
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

@app.get("/orders/count")
def get_orders_count(status: Optional[str] = Query(None)):
    """Get total number of orders"""
    orders = load_orders()
    if status and status != "all":
        orders = [o for o in orders if o["status"] == status]
    return {"count": len(orders)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
