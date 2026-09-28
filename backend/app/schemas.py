from pydantic import BaseModel
from typing import Optional

class PredictionRequest(BaseModel):
    guest_count: int
    meal_type: str

class InventoryCreate(BaseModel):
    name: str
    category: str
    quantity: float
    unit: str
    expiry_date: str
    status: str

class InventoryItem(InventoryCreate):
    id: int

    class Config:
        from_attributes = True

class SurplusListing(BaseModel):
    id: int
    food_title: str
    quantity_kg: float
    prep_time: str
    matched_ngo: str
    distance_km: float
    status: str

    class Config:
        from_attributes = True
        