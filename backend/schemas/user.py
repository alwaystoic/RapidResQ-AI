from typing import Optional

from pydantic import BaseModel, EmailStr, Field


# =========================================================
# CREATE USER
# =========================================================

class UserCreate(BaseModel):
    full_name: str = Field(
        ...,
        min_length=2,
        max_length=100,
    )

    email: EmailStr

    phone: str = Field(
        ...,
        pattern=r"^[6-9]\d{9}$",
    )

    password: str = Field(
        ...,
        min_length=6,
        max_length=128,
    )

    role: str = Field(
        ...,
        pattern=r"^(Admin|Citizen)$",
    )

    status: Optional[str] = Field(
        default="Active",
        pattern=r"^(Active|Inactive)$",
    )


# =========================================================
# UPDATE USER
# =========================================================

class UserUpdate(BaseModel):
    full_name: str = Field(
        ...,
        min_length=2,
        max_length=100,
    )

    email: EmailStr

    phone: str = Field(
        ...,
        pattern=r"^[6-9]\d{9}$",
    )

    role: str = Field(
        ...,
        pattern=r"^(Admin|Citizen)$",
    )

    status: str = Field(
        ...,
        pattern=r"^(Active|Inactive)$",
    )

    password: Optional[str] = Field(
        default=None,
        min_length=6,
        max_length=128,
    )


# =========================================================
# LOGIN
# =========================================================

class UserLogin(BaseModel):
    email: EmailStr

    password: str = Field(
        ...,
        min_length=1,
        max_length=128,
    )


# =========================================================
# USER RESPONSE
# =========================================================

class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    phone: str
    role: str
    status: str

    class Config:
        from_attributes = True