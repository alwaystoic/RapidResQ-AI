from sqlalchemy import Column, Integer, String
from backend.database.database import Base


class Ambulance(Base):
    __tablename__ = "ambulances"

    id = Column(Integer, primary_key=True, index=True)
    vehicle = Column(String, unique=True, nullable=False)
    status = Column(String, nullable=False)
    location = Column(String, nullable=False)