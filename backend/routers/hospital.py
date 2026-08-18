from fastapi import APIRouter, Depends, Query, status, HTTPException
from sqlalchemy.orm import Session

from backend.database.database import get_db
from backend.models.hospital import Hospital
from backend.schemas.hospital import HospitalCreate

from backend.auth.dependencies import get_current_user
from backend.auth.roles import require_role
from backend.models.user import User

router = APIRouter()


def hospital_response(hospital):
    return {
        "id": hospital.id,
        "name": hospital.name,
        "location": hospital.location,
        "contact": hospital.contact,
        "available_beds": hospital.available_beds,
        "latitude": hospital.latitude,
        "longitude": hospital.longitude,
        "status": hospital.status
    }


# ==========================
# GET ALL HOSPITALS
# (Citizen + Admin)
# ==========================
@router.get("/hospitals")
def get_hospitals(
    location: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Hospital)

    if location:
        query = query.filter(Hospital.location == location)

    hospitals = query.all()

    return {
        "logged_in_as": current_user.email,
        "hospitals": [
            hospital_response(h)
            for h in hospitals
        ]
    }


# ==========================
# GET SINGLE HOSPITAL
# (Citizen + Admin)
# ==========================
@router.get("/hospitals/{hospital_id}")
def get_hospital(
    hospital_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    hospital = db.query(Hospital).filter(
        Hospital.id == hospital_id
    ).first()

    if not hospital:
        raise HTTPException(
            status_code=404,
            detail="Hospital not found"
        )

    return hospital_response(hospital)


# ==========================
# CREATE HOSPITAL
# (Admin Only)
# ==========================
@router.post("/hospitals", status_code=status.HTTP_201_CREATED)
def create_hospital(
    hospital: HospitalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Admin"))
):
    new_hospital = Hospital(
    name=hospital.name,
    location=hospital.location,
    contact=hospital.contact,
    available_beds=hospital.available_beds,
    latitude=hospital.latitude,
    longitude=hospital.longitude,
    status=hospital.status
)

    db.add(new_hospital)
    db.commit()
    db.refresh(new_hospital)

    return {
        "message": "Hospital created successfully",
        "data": hospital_response(new_hospital)
    }


# ==========================
# UPDATE HOSPITAL
# (Admin Only)
# ==========================
@router.put("/hospitals/{hospital_id}")
def update_hospital(
    hospital_id: int,
    hospital: HospitalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Admin"))
):
    db_hospital = db.query(Hospital).filter(
        Hospital.id == hospital_id
    ).first()

    if not db_hospital:
        raise HTTPException(
            status_code=404,
            detail="Hospital not found"
        )

    db_hospital.name = hospital.name
    db_hospital.location = hospital.location
    db_hospital.contact = hospital.contact
    db_hospital.available_beds = hospital.available_beds
    db_hospital.status = hospital.status
    db_hospital.latitude = hospital.latitude
    db_hospital.longitude = hospital.longitude

    db.commit()
    db.refresh(db_hospital)

    return {
        "message": "Hospital updated successfully",
        "data": hospital_response(db_hospital)
    }


# ==========================
# DELETE HOSPITAL
# (Admin Only)
# ==========================
@router.delete("/hospitals/{hospital_id}")
def delete_hospital(
    hospital_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Admin"))
):
    db_hospital = db.query(Hospital).filter(
        Hospital.id == hospital_id
    ).first()

    if not db_hospital:
        raise HTTPException(
            status_code=404,
            detail="Hospital not found"
        )

    db.delete(db_hospital)
    db.commit()

    return {
        "message": "Hospital deleted successfully"
    }