from sqlalchemy import Column, Integer, String, Float
from app.database import Base

class InventoryItem(Base):
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    category = Column(String(50))
    quantity = Column(Float, nullable=False)
    unit = Column(String(20), default="kg")
    expiry_date = Column(String(20))
    status = Column(String(20), default="Fresh")

class SurplusListing(Base):
    __tablename__ = "surplus_listings"

    id = Column(Integer, primary_key=True, index=True)
    food_title = Column(String(150), nullable=False)
    quantity_kg = Column(Float, nullable=False)
    prep_time = Column(String(50))
    matched_ngo = Column(String(150))
    distance_km = Column(Float)
    status = Column(String(30), default="Available")