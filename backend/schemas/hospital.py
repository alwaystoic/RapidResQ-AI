from typing import Optional

from pydantic import BaseModel


class HospitalCreate(BaseModel):
    name: str
    location: str
    contact: str

    available_beds: int

    latitude: float
    longitude: float

    status: Optional[str] = "Available"


class HospitalUpdate(BaseModel):
    name: str
    location: str
    contact: str

    available_beds: int

    latitude: float
    longitude: float

    status: str


class HospitalResponse(BaseModel):
    id: int

    name: str
    location: str
    contact: str

    available_beds: int

    latitude: float
    longitude: float

    status: str

    class Config:
        from_attributes = True