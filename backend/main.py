from fastapi import FastAPI
from backend.routers.ambulance import router as ambulance_router

app = FastAPI()


@app.get("/")
def home():
    return {
        "message": "Welcome to RapidResQ AI 🚑"
    }


app.include_router(ambulance_router)