from fastapi import FastAPI

from backend.database.database import engine, Base

# Import models
from backend.models.ambulance import Ambulance
from backend.models.hospital import Hospital
from backend.models.emergency import Emergency
from backend.models.user import User

# Import routers
from backend.routers import ambulance
from backend.routers import hospital
from backend.routers import emergency
from backend.routers import user

# Import authentication router
from backend.auth import auth

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="RapidResQ API")

# Include routers
app.include_router(ambulance.router)
app.include_router(hospital.router)
app.include_router(emergency.router)
app.include_router(user.router)
app.include_router(auth.router)


@app.get("/")
def home():
    return {
        "message": "Welcome to RapidResQ AI 🚑"
    }