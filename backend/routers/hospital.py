from fastapi import APIRouter, Depends, Query, status, HTTPException
from sqlalchemy.orm import Session

from backend.database.database import get_db
from backend.models.hospital import Hospital
from backend.schemas.hospital import HospitalCreate

router = APIRouter()


@router.get("/hospitals")
def get_hospitals(
    location: str | None = Query(default=None),
    db: Session = Depends(get_db)
):
    query = db.query(Hospital)

    if location:
        query = query.filter(Hospital.location == location)

    hospitals = query.all()

    return {"hospitals": hospitals}


@router.get("/hospitals/{hospital_id}")
def get_hospital(
    hospital_id: int,
    db: Session = Depends(get_db)
):
    hospital = db.query(Hospital).filter(
        Hospital.id == hospital_id
    ).first()

    if not hospital:
        raise HTTPException(
            status_code=404,
            detail="Hospital not found"
        )

    return hospital


@router.post("/hospitals", status_code=status.HTTP_201_CREATED)
def create_hospital(
    hospital: HospitalCreate,
    db: Session = Depends(get_db)
):
    new_hospital = Hospital(
        name=hospital.name,
        location=hospital.location,
        contact=hospital.contact,
        available_beds=hospital.available_beds
    )

    db.add(new_hospital)
    db.commit()
    db.refresh(new_hospital)

    return {
        "message": "Hospital created successfully",
        "data": new_hospital
    }


@router.put("/hospitals/{hospital_id}")
def update_hospital(
    hospital_id: int,
    hospital: HospitalCreate,
    db: Session = Depends(get_db)
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

    db.commit()
    db.refresh(db_hospital)

    return {
        "message": "Hospital updated successfully",
        "data": db_hospital
    }


@router.delete("/hospitals/{hospital_id}")
def delete_hospital(
    hospital_id: int,
    db: Session = Depends(get_db)
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