from pydantic import BaseModel


class HospitalCreate(BaseModel):
    name: str
    location: str
    contact: str
    available_beds: int


class HospitalResponse(HospitalCreate):
    id: int

    class Config:
        from_attributes = True