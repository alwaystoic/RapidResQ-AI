from typing import Optional

from pydantic import BaseModel, EmailStr


# =========================================================
# CREATE USER
# =========================================================

class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    password: str
    role: str
    status: Optional[str] = "Active"


# =========================================================
# UPDATE USER
# =========================================================

class UserUpdate(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    role: str
    status: str
    password: Optional[str] = None


# =========================================================
# LOGIN
# =========================================================

class UserLogin(BaseModel):
    email: EmailStr
    password: str


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