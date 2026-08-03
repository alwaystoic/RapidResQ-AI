from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database.database import get_db
from backend.models.emergency import Emergency
from backend.schemas.emergency import EmergencyCreate

router = APIRouter()


@router.get("/emergencies")
def get_emergencies(
    db: Session = Depends(get_db)
):
    emergencies = db.query(Emergency).all()

    return {
        "emergencies": emergencies
    }


@router.post("/emergencies", status_code=status.HTTP_201_CREATED)
def create_emergency(
    emergency: EmergencyCreate,
    db: Session = Depends(get_db)
):
    new_emergency = Emergency(
        patient_name=emergency.patient_name,
        phone=emergency.phone,
        emergency_type=emergency.emergency_type,
        location=emergency.location
    )

    db.add(new_emergency)
    db.commit()
    db.refresh(new_emergency)

    return {
        "message": "Emergency created successfully",
        "data": new_emergency
    }


@router.get("/emergencies/{emergency_id}")
def get_emergency(
    emergency_id: int,
    db: Session = Depends(get_db)
):
    emergency = db.query(Emergency).filter(
        Emergency.id == emergency_id
    ).first()

    if not emergency:
        raise HTTPException(
            status_code=404,
            detail="Emergency not found"
        )

    return emergency


@router.put("/emergencies/{emergency_id}")
def update_emergency(
    emergency_id: int,
    emergency: EmergencyCreate,
    db: Session = Depends(get_db)
):
    db_emergency = db.query(Emergency).filter(
        Emergency.id == emergency_id
    ).first()

    if not db_emergency:
        raise HTTPException(
            status_code=404,
            detail="Emergency not found"
        )

    db_emergency.patient_name = emergency.patient_name
    db_emergency.phone = emergency.phone
    db_emergency.emergency_type = emergency.emergency_type
    db_emergency.location = emergency.location

    db.commit()
    db.refresh(db_emergency)

    return {
        "message": "Emergency updated successfully",
        "data": db_emergency
    }


@router.delete("/emergencies/{emergency_id}")
def delete_emergency(
    emergency_id: int,
    db: Session = Depends(get_db)
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