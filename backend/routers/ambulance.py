from fastapi import APIRouter, Depends, Query, status, HTTPException
from sqlalchemy.exc import IntegrityError
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
        "location": ambulance.location,
        "latitude": ambulance.latitude,
        "longitude": ambulance.longitude,
        "status": ambulance.status,
    }


# ==========================
# GET ALL AMBULANCES
# (Citizen + Admin)
# ==========================
@router.get("/ambulances")
def get_ambulances(
    status: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Ambulance)

    if status:
        query = query.filter(Ambulance.status == status)

    ambulances = query.all()

    return {
        "logged_in_as": current_user.email,
        "ambulances": [
            ambulance_response(ambulance)
            for ambulance in ambulances
        ],
    }


# ==========================
# GET SINGLE AMBULANCE
# (Citizen + Admin)
# ==========================
@router.get("/ambulances/{ambulance_id}")
def get_ambulance(
    ambulance_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ambulance = db.query(Ambulance).filter(
        Ambulance.id == ambulance_id
    ).first()

    if not ambulance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ambulance not found",
        )

    return ambulance_response(ambulance)


# ==========================
# CREATE AMBULANCE
# (Admin Only)
# ==========================
@router.post(
    "/ambulances",
    status_code=status.HTTP_201_CREATED,
)
def create_ambulance(
    ambulance: AmbulanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Admin")),
):
    # Check for duplicate vehicle before inserting
    existing_vehicle = db.query(Ambulance).filter(
        Ambulance.vehicle == ambulance.vehicle
    ).first()

    if existing_vehicle:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vehicle already registered",
        )

    new_ambulance = Ambulance(
        vehicle=ambulance.vehicle,
        status=ambulance.status,
        location=ambulance.location,
        latitude=ambulance.latitude,
        longitude=ambulance.longitude,
    )

    try:
        db.add(new_ambulance)
        db.commit()
        db.refresh(new_ambulance)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unable to create ambulance. Vehicle may already exist.",
        )

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while creating the ambulance.",
        )

    return {
        "message": "Ambulance created successfully",
        "data": ambulance_response(new_ambulance),
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
    current_user: User = Depends(require_role("Admin")),
):
    db_ambulance = db.query(Ambulance).filter(
        Ambulance.id == ambulance_id
    ).first()

    if not db_ambulance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ambulance not found",
        )

    # Prevent duplicate vehicle numbers
    existing_vehicle = db.query(Ambulance).filter(
        Ambulance.vehicle == ambulance.vehicle,
        Ambulance.id != ambulance_id,
    ).first()

    if existing_vehicle:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vehicle already registered",
        )

    db_ambulance.vehicle = ambulance.vehicle
    db_ambulance.status = ambulance.status
    db_ambulance.location = ambulance.location
    db_ambulance.latitude = ambulance.latitude
    db_ambulance.longitude = ambulance.longitude

    try:
        db.commit()
        db.refresh(db_ambulance)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unable to update ambulance. Vehicle may already exist.",
        )

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while updating the ambulance.",
        )

    return {
        "message": "Ambulance updated successfully",
        "data": ambulance_response(db_ambulance),
    }


# ==========================
# DELETE AMBULANCE
# (Admin Only)
# ==========================
@router.delete("/ambulances/{ambulance_id}")
def delete_ambulance(
    ambulance_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Admin")),
):
    db_ambulance = db.query(Ambulance).filter(
        Ambulance.id == ambulance_id
    ).first()

    if not db_ambulance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ambulance not found",
        )

    try:
        db.delete(db_ambulance)
        db.commit()

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Cannot delete this ambulance because it is "
                "associated with an emergency."
            ),
        )

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while deleting the ambulance.",
        )

    return {
        "message": "Ambulance deleted successfully",
    }