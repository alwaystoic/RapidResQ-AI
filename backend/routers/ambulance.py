from fastapi import APIRouter, Depends, Query, status, HTTPException
from sqlalchemy.orm import Session

from backend.database.database import get_db
from backend.models.ambulance import Ambulance
from backend.schemas.ambulance import AmbulanceCreate

router = APIRouter()


# -------------------------------
# GET ALL AMBULANCES
# -------------------------------
@router.get("/ambulances")
def get_ambulances(
    status: str | None = Query(default=None),
    db: Session = Depends(get_db)
):
    query = db.query(Ambulance)

    if status:
        query = query.filter(Ambulance.status == status)

    ambulances = query.all()

    return {
        "ambulances": ambulances
    }


# -------------------------------
# GET SINGLE AMBULANCE
# -------------------------------
@router.get("/ambulances/{ambulance_id}")
def get_ambulance(
    ambulance_id: int,
    db: Session = Depends(get_db)
):
    ambulance = db.query(Ambulance).filter(
        Ambulance.id == ambulance_id
    ).first()

    if not ambulance:
        raise HTTPException(
            status_code=404,
            detail="Ambulance not found"
        )

    return ambulance


# -------------------------------
# CREATE AMBULANCE
# -------------------------------
@router.post("/ambulances", status_code=status.HTTP_201_CREATED)
def create_ambulance(
    ambulance: AmbulanceCreate,
    db: Session = Depends(get_db)
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
        "data": new_ambulance
    }


# -------------------------------
# UPDATE AMBULANCE
# -------------------------------
@router.put("/ambulances/{ambulance_id}")
def update_ambulance(
    ambulance_id: int,
    ambulance: AmbulanceCreate,
    db: Session = Depends(get_db)
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
        "data": db_ambulance
    }

@router.delete("/ambulances/{ambulance_id}")
def delete_ambulance(
    ambulance_id: int,
    db: Session = Depends(get_db)
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