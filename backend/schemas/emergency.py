from pydantic import BaseModel


class EmergencyCreate(BaseModel):
    patient_name: str
    phone: str
    emergency_type: str
    location: str