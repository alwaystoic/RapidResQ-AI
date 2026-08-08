from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi
from fastapi.middleware.cors import CORSMiddleware

from backend.database.database import engine, Base

# ==========================
# Import Models
# ==========================

from backend.models.ambulance import Ambulance
from backend.models.hospital import Hospital
from backend.models.emergency import Emergency
from backend.models.user import User

# ==========================
# Import Routers
# ==========================

from backend.routers import ambulance
from backend.routers import hospital
from backend.routers import emergency
from backend.routers import user
from backend.routers import dashboard

# ==========================
# Import Authentication Router
# ==========================

from backend.auth import auth

# ==========================
# Create Database Tables
# ==========================

Base.metadata.create_all(bind=engine)

# ==========================
# Create FastAPI App
# ==========================

app = FastAPI(
    title="RapidResQ API",
    version="1.0.0",
    description="AI-powered Emergency Response System"
)

# ==========================
# CORS CONFIGURATION
# ==========================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================
# Include Routers
# ==========================

app.include_router(ambulance.router)
app.include_router(hospital.router)
app.include_router(emergency.router)
app.include_router(user.router)
app.include_router(auth.router)
app.include_router(dashboard.router)

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

    # Add JWT security to every operation
    for path in schema["paths"].values():
        for operation in path.values():
            if isinstance(operation, dict):
                operation["security"] = [
                    {
                        "BearerAuth": []
                    }
                ]

    app.openapi_schema = schema

    return schema


app.openapi = custom_openapi