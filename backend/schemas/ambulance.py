from typing import Optional

from pydantic import BaseModel, Field


# ==========================================
# CREATE AMBULANCE
# ==========================================

class AmbulanceCreate(BaseModel):
    vehicle: str = Field(
        ...,
        min_length=2,
        max_length=50,
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

    status: Optional[str] = Field(
        default="Available",
        pattern=r"^(Available|Assigned|Dispatched|Busy)$",
    )


# ==========================================
# UPDATE AMBULANCE
# ==========================================

class AmbulanceUpdate(BaseModel):
    vehicle: str = Field(
        ...,
        min_length=2,
        max_length=50,
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

    status: str = Field(
        ...,
        pattern=r"^(Available|Assigned|Dispatched|Busy)$",
    )


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