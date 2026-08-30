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

    # Emergency status
    status = Column(
        String,
        default="Pending",
        nullable=False
    )

    # AI severity classification
    severity = Column(
        String,
        default="Medium",
        nullable=False
    )

    # AI priority score
    # Critical = 100
    # High = 75
    # Medium = 50
    # Low = 25
    priority_score = Column(
        Integer,
        default=50,
        nullable=False
    )

    # Explainable AI reason
    ai_reason = Column(
        String,
        nullable=True
    )

    # User who reported the emergency
    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    # Assigned ambulance
    ambulance_id = Column(
        Integer,
        ForeignKey("ambulances.id"),
        nullable=True
    )

    # Assigned hospital
    hospital_id = Column(
        Integer,
        ForeignKey("hospitals.id"),
        nullable=True
    )

    # Emergency creation timestamp
    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )