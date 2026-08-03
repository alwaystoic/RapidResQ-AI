from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi

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

app = FastAPI(
    title="RapidResQ API",
    version="1.0.0",
    description="AI-powered Emergency Response System"
)

# ==========================
# Include Routers
# ==========================

app.include_router(ambulance.router)
app.include_router(hospital.router)
app.include_router(emergency.router)
app.include_router(user.router)
app.include_router(auth.router)

# ==========================
# Home Route
# ==========================

@app.get("/")
def home():
    return {
        "message": "Welcome to RapidResQ AI 🚑"
    }

# ==========================
# Swagger JWT Authentication
# ==========================

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )

    schema.setdefault("components", {})
    schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
        }
    }

    # Add security to EVERY operation
    for path in schema["paths"].values():
        for operation in path.values():
            operation["security"] = [
                {
                    "BearerAuth": []
                }
            ]

    app.openapi_schema = schema
    return schema

app.openapi = custom_openapi