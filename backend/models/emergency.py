from sqlalchemy import Column, Integer, String

from backend.database.database import Base


class Emergency(Base):
    __tablename__ = "emergencies"

    id = Column(Integer, primary_key=True, index=True)

    patient_name = Column(String, nullable=False)

    phone = Column(String, nullable=False)

    emergency_type = Column(String, nullable=False)

    location = Column(String, nullable=False)

    status = Column(String, default="Pending")