from fastapi import FastAPI

from backend.database.database import engine, Base
from backend.models.ambulance import Ambulance

Base.metadata.create_all(bind=engine)

app = FastAPI(title="RapidResQ API")

from backend.routers import ambulance

app.include_router(ambulance.router)