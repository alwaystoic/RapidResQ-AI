from datetime import datetime

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Float
)

from backend.database.database import Base


class Emergency(Base):
    __tablename__ = "emergencies"

    id = Column(Integer, primary_key=True, index=True)

    patient_name = Column(String, nullable=False)

    phone = Column(String, nullable=False)

    emergency_type = Column(String, nullable=False)

    location = Column(String, nullable=False)

    # GPS Coordinates
    latitude = Column(Float, nullable=False)

    longitude = Column(Float, nullable=False)

    status = Column(
        String,
        default="Pending"
    )

    severity = Column(
        String,
        default="Medium"
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    ambulance_id = Column(
        Integer,
        ForeignKey("ambulances.id"),
        nullable=True
    )

    hospital_id = Column(
        Integer,
        ForeignKey("hospitals.id"),
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )