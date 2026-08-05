from fastapi import APIRouter, Depends, Query, status, HTTPException
from sqlalchemy.orm import Session

from backend.database.database import get_db
from backend.models.ambulance import Ambulance
from backend.schemas.ambulance import AmbulanceCreate

from backend.auth.dependencies import get_current_user
from backend.auth.roles import require_role
from backend.models.user import User

router = APIRouter()


def ambulance_response(ambulance):
    return {
        "id": ambulance.id,
        "vehicle": ambulance.vehicle,
        "status": ambulance.status,
        "location": ambulance.location
    }


# ==========================
# GET ALL AMBULANCES
# (Citizen + Admin)
# ==========================
@router.get("/ambulances")
def get_ambulances(
    status: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Ambulance)

    if status:
        query = query.filter(Ambulance.status == status)

    ambulances = query.all()

    return {
        "logged_in_as": current_user.email,
        "ambulances": [
            ambulance_response(a)
            for a in ambulances
        ]
    }


# ==========================
# GET SINGLE AMBULANCE
# (Citizen + Admin)
# ==========================
@router.get("/ambulances/{ambulance_id}")
def get_ambulance(
    ambulance_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ambulance = db.query(Ambulance).filter(
        Ambulance.id == ambulance_id
    ).first()

    if not ambulance:
        raise HTTPException(
            status_code=404,
            detail="Ambulance not found"
        )

    return ambulance_response(ambulance)


# ==========================
# CREATE AMBULANCE
# (Admin Only)
# ==========================
@router.post("/ambulances", status_code=status.HTTP_201_CREATED)
def create_ambulance(
    ambulance: AmbulanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Admin"))
):
    new_ambulance = Ambulance(
        vehicle=ambulance.vehicle,
        status=ambulance.status,
        location=ambulance.location
    )

    db.add(new_ambulance)
    db.commit()
    db.refresh(new_ambulance)

    return {
        "message": "Ambulance created successfully",
        "data": ambulance_response(new_ambulance)
    }


# ==========================
# UPDATE AMBULANCE
# (Admin Only)
# ==========================
@router.put("/ambulances/{ambulance_id}")
def update_ambulance(
    ambulance_id: int,
    ambulance: AmbulanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Admin"))
):
    db_ambulance = db.query(Ambulance).filter(
        Ambulance.id == ambulance_id
    ).first()

    if not db_ambulance:
        raise HTTPException(
            status_code=404,
            detail="Ambulance not found"
        )

    db_ambulance.vehicle = ambulance.vehicle
    db_ambulance.status = ambulance.status
    db_ambulance.location = ambulance.location

    db.commit()
    db.refresh(db_ambulance)

    return {
        "message": "Ambulance updated successfully",
        "data": ambulance_response(db_ambulance)
    }


# ==========================
# DELETE AMBULANCE
# (Admin Only)
# ==========================
@router.delete("/ambulances/{ambulance_id}")
def delete_ambulance(
    ambulance_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Admin"))
):
    db_ambulance = db.query(Ambulance).filter(
        Ambulance.id == ambulance_id
    ).first()

    if not db_ambulance:
        raise HTTPException(
            status_code=404,
            detail="Ambulance not found"
        )

    db.delete(db_ambulance)
    db.commit()

    return {
        "message": "Ambulance deleted successfully"
    }