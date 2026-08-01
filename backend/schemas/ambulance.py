from pydantic import BaseModel


class AmbulanceCreate(BaseModel):
    vehicle: str
    status: str
    location: str


class AmbulanceUpdate(BaseModel):
    vehicle: str
    status: str
    location: str