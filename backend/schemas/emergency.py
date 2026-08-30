from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


# =========================================================
# CREATE EMERGENCY
# =========================================================

class EmergencyCreate(BaseModel):
    patient_name: str = Field(
        ...,
        min_length=2,
        max_length=100,
    )

    phone: str = Field(
        ...,
        pattern=r"^[6-9]\d{9}$",
    )

    emergency_type: str = Field(
        ...,
        min_length=2,
        max_length=100,
    )

    location: str = Field(
        ...,
        min_length=2,
        max_length=255,
    )

    latitude: float = Field(
        ...,
        ge=-90,
        le=90,
    )

    longitude: float = Field(
        ...,
        ge=-180,
        le=180,
    )


# =========================================================
# UPDATE EMERGENCY
# =========================================================

class EmergencyUpdate(BaseModel):
    status: Optional[str] = Field(
        default=None,
        pattern=r"^(Pending|Assigned)$",
    )

    ambulance_id: Optional[int] = Field(
        default=None,
        gt=0,
    )

    hospital_id: Optional[int] = Field(
        default=None,
        gt=0,
    )


# =========================================================
# AMBULANCE RESPONSE
# =========================================================

class AmbulanceResponse(BaseModel):
    id: int
    vehicle: str
    status: str
    location: str
    latitude: float
    longitude: float


# =========================================================
# EMERGENCY RESPONSE
# =========================================================

class EmergencyResponse(BaseModel):
    id: int

    patient_name: str
    phone: str
    emergency_type: str
    location: str

    latitude: float
    longitude: float

    status: str
    severity: str

    user_id: int

    ambulance_id: Optional[int]
    hospital_id: Optional[int]

    ambulance: Optional[AmbulanceResponse] = None

    distance_km: Optional[float] = None

    estimated_arrival_minutes: Optional[int] = None

    created_at: datetime

    class Config:
        from_attributes = True