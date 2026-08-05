from sqlalchemy import Column, Integer, String

from backend.database.database import Base


class Hospital(Base):
    __tablename__ = "hospitals"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String, nullable=False)

    location = Column(String, nullable=False)

    contact = Column(String, nullable=False)

    available_beds = Column(Integer, nullable=False)

    status = Column(
        String,
        default="Available",
        nullable=False
    )