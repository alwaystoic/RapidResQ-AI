from typing import Optional

from pydantic import BaseModel, Field


# =========================================================
# CREATE HOSPITAL
# =========================================================

class HospitalCreate(BaseModel):
    name: str = Field(
        ...,
        min_length=2,
        max_length=150,
    )

    location: str = Field(
        ...,
        min_length=2,
        max_length=255,
    )

    contact: str = Field(
        ...,
        pattern=r"^[6-9]\d{9}$",
    )

    available_beds: int = Field(
        ...,
        ge=0,
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
        pattern=r"^(Available|Occupied|Full)$",
    )


# =========================================================
# UPDATE HOSPITAL
# =========================================================

class HospitalUpdate(BaseModel):
    name: str = Field(
        ...,
        min_length=2,
        max_length=150,
    )

    location: str = Field(
        ...,
        min_length=2,
        max_length=255,
    )

    contact: str = Field(
        ...,
        pattern=r"^[6-9]\d{9}$",
    )

    available_beds: int = Field(
        ...,
        ge=0,
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
        pattern=r"^(Available|Occupied|Full)$",
    )


# =========================================================
# HOSPITAL RESPONSE
# =========================================================

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