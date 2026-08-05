from typing import Optional

from pydantic import BaseModel


class AmbulanceCreate(BaseModel):
    vehicle: str
    location: str
    status: Optional[str] = "Available"


class AmbulanceUpdate(BaseModel):
    vehicle: str
    location: str
    status: str