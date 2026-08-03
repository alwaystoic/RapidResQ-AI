from pydantic import BaseModel


class UserCreate(BaseModel):
    full_name: str
    email: str
    phone: str
    password: str
    role: str