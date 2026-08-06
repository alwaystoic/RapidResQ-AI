from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database.database import get_db
from backend.models.emergency import Emergency
from backend.models.user import User

from backend.schemas.emergency import (
    EmergencyCreate,
    EmergencyUpdate
)

from backend.auth.dependencies import get_current_user
from backend.auth.roles import require_role

from backend.services.ai_service import predict_severity
from backend.services.assignment_service import assign_ambulance
from backend.services.hospital_assignment import assign_hospital

router = APIRouter()


def emergency_response(emergency):
    return {
        "id": emergency.id,
        "patient_name": emergency.patient_name,
        "phone": emergency.phone,
        "emergency_type": emergency.emergency_type,
        "location": emergency.location,
        "status": emergency.status,
        "severity": emergency.severity,
        "user_id": emergency.user_id,
        "ambulance_id": emergency.ambulance_id,
        "hospital_id": emergency.hospital_id,
        "created_at": emergency.created_at
    }


# ==========================================
# GET ALL EMERGENCIES (Admin Only)
# ==========================================

@router.get("/emergencies")
def get_emergencies(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Admin"))
):
    emergencies = db.query(Emergency).all()

    return {
        "logged_in_as": current_user.email,
        "emergencies": [
            emergency_response(e)
            for e in emergencies
        ]
    }


# ==========================================
# CREATE EMERGENCY
# ==========================================

@router.post("/emergencies", status_code=status.HTTP_201_CREATED)
def create_emergency(
    emergency: EmergencyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # AI Severity Prediction
    severity = predict_severity(emergency.emergency_type)

    # Automatic Ambulance Assignment
    assigned_ambulance = assign_ambulance(db)

    # Automatic Hospital Assignment
    assigned_hospital = assign_hospital(db)

    # Emergency Status
    if assigned_ambulance and assigned_hospital:
        emergency_status = "Assigned"
    else:
        emergency_status = "Pending"

    new_emergency = Emergency(
        patient_name=emergency.patient_name,
        phone=emergency.phone,
        emergency_type=emergency.emergency_type,
        location=emergency.location,

        severity=severity,
        status=emergency_status,

        user_id=current_user.id,

        ambulance_id=assigned_ambulance.id if assigned_ambulance else None,
        hospital_id=assigned_hospital.id if assigned_hospital else None
    )

    db.add(new_emergency)
    db.commit()
    db.refresh(new_emergency)

    return {
        "message": "Emergency created successfully",
        "ambulance": (
            {
                "id": assigned_ambulance.id,
                "vehicle": assigned_ambulance.vehicle
            }
            if assigned_ambulance else None
        ),
        "hospital": (
            {
                "id": assigned_hospital.id,
                "name": assigned_hospital.name
            }
            if assigned_hospital else None
        ),
        "data": emergency_response(new_emergency)
    }


# ==========================================
# GET SINGLE EMERGENCY
# ==========================================

@router.get("/emergencies/{emergency_id}")
def get_emergency(
    emergency_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    emergency = db.query(Emergency).filter(
        Emergency.id == emergency_id
    ).first()

    if not emergency:
        raise HTTPException(
            status_code=404,
            detail="Emergency not found"
        )

    if (
        current_user.role != "Admin"
        and emergency.user_id != current_user.id
    ):
        raise HTTPException(
            status_code=403,
            detail="Access denied"
        )

    return emergency_response(emergency)


# ==========================================
# UPDATE EMERGENCY
# ==========================================

@router.put("/emergencies/{emergency_id}")
def update_emergency(
    emergency_id: int,
    emergency: EmergencyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Admin"))
):

    db_emergency = db.query(Emergency).filter(
        Emergency.id == emergency_id
    ).first()

    if not db_emergency:
        raise HTTPException(
            status_code=404,
            detail="Emergency not found"
        )

    db_emergency.status = emergency.status
    db_emergency.ambulance_id = emergency.ambulance_id
    db_emergency.hospital_id = emergency.hospital_id

    db.commit()
    db.refresh(db_emergency)

    return {
        "message": "Emergency updated successfully",
        "data": emergency_response(db_emergency)
    }


# ==========================================
# DELETE EMERGENCY
# ==========================================

@router.delete("/emergencies/{emergency_id}")
def delete_emergency(
    emergency_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Admin"))
):

    db_emergency = db.query(Emergency).filter(
        Emergency.id == emergency_id
    ).first()

    if not db_emergency:
        raise HTTPException(
            status_code=404,
            detail="Emergency not found"
        )

    db.delete(db_emergency)
    db.commit()

    return {
        "message": "Emergency deleted successfully"
    }