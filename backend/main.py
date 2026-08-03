from fastapi import FastAPI

from backend.database.database import engine, Base

# Import models
from backend.models.ambulance import Ambulance
from backend.models.hospital import Hospital
from backend.models.emergency import Emergency

# Import routers
from backend.routers import ambulance
from backend.routers import hospital
from backend.routers import emergency

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="RapidResQ API")

# Include routers
app.include_router(ambulance.router)
app.include_router(hospital.router)
app.include_router(emergency.router)


@app.get("/")
def home():
    return {
        "message": "Welcome to RapidResQ AI 🚑"
    }