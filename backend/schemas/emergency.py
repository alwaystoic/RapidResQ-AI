from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class EmergencyCreate(BaseModel):
    patient_name: str
    phone: str
    emergency_type: str
    location: str


class EmergencyUpdate(BaseModel):
    status: str
    ambulance_id: Optional[int] = None
    hospital_id: Optional[int] = None


class EmergencyResponse(BaseModel):
    id: int

    patient_name: str
    phone: str
    emergency_type: str
    location: str

    status: str
    severity: str

    user_id: int

    ambulance_id: Optional[int]
    hospital_id: Optional[int]

    created_at: datetime

    class Config:
        from_attributes = True