from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List

from app.database import engine, Base, get_db
from app import models, schemas

Base.metadata.create_all(bind=engine)

app = FastAPI(title="EcoHarvest AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Demo User Accounts for Login
USERS_DB = {
    "chef@ecoharvest.org": {"password": "123", "role": "Kitchen Manager", "name": "Chef Marcus"},
    "ngo@ecoharvest.org": {"password": "123", "role": "NGO Coordinator", "name": "Elena Rostova"},
    "driver@ecoharvest.org": {"password": "123", "role": "Delivery Staff", "name": "David Miller"},
    "admin@ecoharvest.org": {"password": "123", "role": "Admin", "name": "Sarah Jenkins"},
}

class LoginRequest(BaseModel):
    email: str
    password: str

# Seed initial database rows if empty
@app.on_event("startup")
def seed_database():
    db = next(get_db())
    if db.query(models.InventoryItem).count() == 0:
        db.add_all([
            models.InventoryItem(name="Basmati Rice", category="Grains", quantity=120.0, unit="kg", expiry_date="2026-10-15", status="Fresh"),
            models.InventoryItem(name="Fresh Tomatoes", category="Produce", quantity=35.5, unit="kg", expiry_date="2026-09-24", status="Expiring Soon"),
            models.InventoryItem(name="Whole Milk", category="Dairy", quantity=15.0, unit="L", expiry_date="2026-09-23", status="Critical"),
        ])
    if db.query(models.SurplusListing).count() == 0:
        db.add_all([
            models.SurplusListing(food_title="50 Portions Veg Biryani", quantity_kg=25.0, prep_time="2 hrs ago", matched_ngo="Hope Feeding Center", distance_km=2.4, status="Available"),
            models.SurplusListing(food_title="30 Packets Fresh Bread", quantity_kg=12.0, prep_time="1 hr ago", matched_ngo="City Shelter Alliance", distance_km=4.1, status="Available"),
        ])
    db.commit()

# --- 1. AUTHENTICATION ENDPOINT ---
@app.post("/api/login")
def login(credentials: LoginRequest):
    user = USERS_DB.get(credentials.email)
    if not user or user["password"] != credentials.password:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return {
        "access_token": f"fake-jwt-token-{user['role']}",
        "token_type": "bearer",
        "user": {"email": credentials.email, "name": user["name"], "role": user["role"]}
    }

# --- 2. AI DEMAND PREDICTION ENDPOINT ---
@app.post("/api/predict-demand")
def predict_demand(data: schemas.PredictionRequest):
    meal_factor = 1.0 if data.meal_type == "Lunch" else (1.2 if data.meal_type == "Dinner" else 0.8)
    predicted_kg = round(float(max(data.guest_count * 0.38 * meal_factor, 10.0)), 2)
    return {
        "expected_guests": data.guest_count,
        "meal_type": data.meal_type,
        "predicted_food_needed_kg": predicted_kg,
        "recommended_prep_kg": round(predicted_kg * 1.08, 2)
    }

# --- 3. INVENTORY DATABASE CRUD ---
@app.get("/api/inventory", response_model=List[schemas.InventoryItem])
def get_inventory(db: Session = Depends(get_db)):
    return db.query(models.InventoryItem).all()

@app.post("/api/inventory", response_model=schemas.InventoryItem)
def create_inventory(item: schemas.InventoryCreate, db: Session = Depends(get_db)):
    db_item = models.InventoryItem(**item.dict())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@app.delete("/api/inventory/{item_id}")
def delete_inventory(item_id: int, db: Session = Depends(get_db)):
    item = db.query(models.InventoryItem).filter(models.InventoryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(item)
    db.commit()
    return {"message": "Deleted successfully"}

# --- 4. SURPLUS REDISTRIBUTION ENDPOINTS ---
@app.get("/api/surplus", response_model=List[schemas.SurplusListing])
def get_surplus(db: Session = Depends(get_db)):
    return db.query(models.SurplusListing).all()

@app.post("/api/surplus/{item_id}/claim")
def claim_surplus(item_id: int, db: Session = Depends(get_db)):
    item = db.query(models.SurplusListing).filter(models.SurplusListing.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Surplus listing not found")
    item.status = "Claimed"
    db.commit()
    return {"message": "Surplus claimed", "status": "Claimed"}