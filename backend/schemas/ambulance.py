from typing import Optional

from pydantic import BaseModel


# ==========================================
# CREATE AMBULANCE
# ==========================================

class AmbulanceCreate(BaseModel):
    vehicle: str
    location: str

    latitude: float
    longitude: float

    status: Optional[str] = "Available"


# ==========================================
# UPDATE AMBULANCE
# ==========================================

class AmbulanceUpdate(BaseModel):
    vehicle: str
    location: str

    latitude: float
    longitude: float

    status: str


# ==========================================
# AMBULANCE RESPONSE
# ==========================================

class AmbulanceResponse(BaseModel):
    id: int

    vehicle: str
    location: str

    latitude: float
    longitude: float

    status: str

    class Config:
        from_attributes = True