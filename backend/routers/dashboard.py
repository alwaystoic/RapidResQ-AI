from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.database.database import get_db

from backend.auth.dependencies import require_role
from backend.models.user import User

from backend.models.emergency import Emergency
from backend.models.ambulance import Ambulance
from backend.models.hospital import Hospital

router = APIRouter(
    tags=["Dashboard"]
)

@router.get("/dashboard/admin")
def admin_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Admin"))
):

    total_emergencies = db.query(Emergency).count()

    pending_emergencies = (
        db.query(Emergency)
        .filter(Emergency.status == "Pending")
        .count()
    )

    assigned_emergencies = (
        db.query(Emergency)
        .filter(Emergency.status == "Assigned")
        .count()
    )

    available_ambulances = (
        db.query(Ambulance)
        .filter(Ambulance.status == "Available")
        .count()
    )

    busy_ambulances = (
        db.query(Ambulance)
        .filter(Ambulance.status == "Busy")
        .count()
    )

    total_available_beds = (
        db.query(Hospital)
        .with_entities(Hospital.available_beds)
        .all()
    )

    beds = sum(bed[0] for bed in total_available_beds)

    return {
        "total_emergencies": total_emergencies,
        "pending_emergencies": pending_emergencies,
        "assigned_emergencies": assigned_emergencies,
        "available_ambulances": available_ambulances,
        "busy_ambulances": busy_ambulances,
        "available_hospital_beds": beds
    }

@router.get("/dashboard")
def dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Admin"))
):

    # Emergency Statistics
    total_emergencies = db.query(Emergency).count()

    pending_cases = db.query(Emergency).filter(
        Emergency.status == "Pending"
    ).count()

    assigned_cases = db.query(Emergency).filter(
        Emergency.status == "Assigned"
    ).count()

    completed_cases = db.query(Emergency).filter(
        Emergency.status == "Completed"
    ).count()

    critical_cases = db.query(Emergency).filter(
        Emergency.severity == "Critical"
    ).count()

    # Ambulance Statistics
    available_ambulances = db.query(Ambulance).filter(
        Ambulance.status == "Available"
    ).count()

    busy_ambulances = db.query(Ambulance).filter(
        Ambulance.status == "Busy"
    ).count()

    # Hospital Statistics
    total_hospitals = db.query(Hospital).count()

    available_hospital_beds = (
        db.query(
            func.sum(Hospital.available_beds)
        ).scalar()
        or 0
    )

    return {
        "admin": current_user.email,

        "emergencies": {
            "total": total_emergencies,
            "pending": pending_cases,
            "assigned": assigned_cases,
            "completed": completed_cases,
            "critical": critical_cases
        },

        "ambulances": {
            "available": available_ambulances,
            "busy": busy_ambulances
        },

        "hospitals": {
            "total": total_hospitals,
            "available_beds": available_hospital_beds
        }
    }