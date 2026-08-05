from pydantic import BaseModel
from typing import Optional


class HospitalCreate(BaseModel):
    name: str
    location: str
    contact: str
    available_beds: int
    status: Optional[str] = "Available"


class HospitalUpdate(BaseModel):
    name: str
    location: str
    contact: str
    available_beds: int
    status: str


class HospitalResponse(BaseModel):
    id: int
    name: str
    location: str
    contact: str
    available_beds: int
    status: str

    class Config:
        from_attributes = True