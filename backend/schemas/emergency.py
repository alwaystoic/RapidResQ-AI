from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class EmergencyCreate(BaseModel):
    patient_name: str
    phone: str
    emergency_type: str
    location: str

    latitude: float
    longitude: float


class EmergencyUpdate(BaseModel):
    status: Optional[str] = None

    ambulance_id: Optional[int] = Field(
        default=None,
        gt=0
    )

    hospital_id: Optional[int] = Field(
        default=None,
        gt=0
    )


class AmbulanceResponse(BaseModel):
    id: int
    vehicle: str
    status: str
    location: str
    latitude: float
    longitude: float


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

    # Distance from ambulance to emergency
    distance_km: Optional[float] = None

    # Estimated ambulance arrival time
    estimated_arrival_minutes: Optional[int] = None

    created_at: datetime

    class Config:
        from_attributes = True