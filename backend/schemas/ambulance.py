from typing import Optional

from pydantic import BaseModel


class AmbulanceCreate(BaseModel):
    vehicle: str
    location: str

    latitude: float
    longitude: float

    status: Optional[str] = "Available"


class AmbulanceUpdate(BaseModel):
    vehicle: str
    location: str

    latitude: float
    longitude: float

    status: str


class AmbulanceResponse(BaseModel):
    id: int

    vehicle: str
    location: str

    latitude: float
    longitude: float

    status: str

    class Config:
        from_attributes = True