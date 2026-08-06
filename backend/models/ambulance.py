from sqlalchemy import Column, Integer, String, Float
from backend.database.database import Base


class Ambulance(Base):
    __tablename__ = "ambulances"

    id = Column(Integer, primary_key=True, index=True)

    vehicle = Column(
        String,
        unique=True,
        nullable=False
    )

    status = Column(
        String,
        default="Available",
        nullable=False
    )

    location = Column(
        String,
        nullable=False
    )

    # GPS Coordinates
    latitude = Column(
        Float,
        nullable=False
    )

    longitude = Column(
        Float,
        nullable=False
    )