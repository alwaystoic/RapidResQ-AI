from datetime import datetime

from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship

from backend.database.database import Base


class Emergency(Base):
    __tablename__ = "emergencies"

    id = Column(Integer, primary_key=True, index=True)

    patient_name = Column(String, nullable=False)

    phone = Column(String, nullable=False)

    emergency_type = Column(String, nullable=False)

    location = Column(String, nullable=False)

    status = Column(String, default="Pending")

    created_at = Column(DateTime, default=datetime.utcnow)

    # User who created the emergency
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Assigned ambulance (optional)
    ambulance_id = Column(Integer, ForeignKey("ambulances.id"), nullable=True)

    # Assigned hospital (optional)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"), nullable=True)

    # Relationships
    user = relationship("User")
    ambulance = relationship("Ambulance")
    hospital = relationship("Hospital")