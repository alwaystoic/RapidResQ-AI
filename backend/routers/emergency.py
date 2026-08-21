from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database.database import get_db
from backend.models.emergency import Emergency
from backend.models.user import User
from backend.models.ambulance import Ambulance
from backend.models.hospital import Hospital

from backend.schemas.emergency import (
    EmergencyCreate,
    EmergencyUpdate
)

from backend.auth.dependencies import get_current_user
from backend.auth.roles import require_role

from backend.services.ai_service import predict_severity
from backend.services.assignment_service import find_nearest_ambulance
from backend.services.hospital_assignment import find_nearest_hospital

from backend.routers.ambulance import ambulance_response
from backend.routers.hospital import hospital_response

from backend.utils.distance import haversine_distance


router = APIRouter()


# ============================================================
# EMERGENCY RESPONSE FORMAT
# ============================================================

def emergency_response(emergency, db):
    """
    Prepare complete emergency response.

    Includes:
    - Emergency details
    - Assigned ambulance details
    - Ambulance distance
    - Estimated arrival time
    """

    ambulance_data = None

    # ========================================================
    # GET ASSIGNED AMBULANCE
    # ========================================================

    if emergency.ambulance_id is not None:

        ambulance = (
            db.query(Ambulance)
            .filter(
                Ambulance.id == emergency.ambulance_id
            )
            .first()
        )

        if ambulance:

            # =================================================
            # CALCULATE DISTANCE
            # =================================================

            distance = haversine_distance(
                emergency.latitude,
                emergency.longitude,
                ambulance.latitude,
                ambulance.longitude
            )

            # =================================================
            # ESTIMATE ARRIVAL TIME
            # Average speed = 40 km/h
            # =================================================

            estimated_minutes = round(
                (distance / 40) * 60
            )

            if distance > 0 and estimated_minutes < 1:
                estimated_minutes = 1

            # =================================================
            # AMBULANCE DATA
            # =================================================

            ambulance_data = {
                "id": ambulance.id,
                "vehicle": ambulance.vehicle,
                "status": ambulance.status,
                "location": ambulance.location,
                "latitude": ambulance.latitude,
                "longitude": ambulance.longitude,
                "distance_km": round(distance, 2),
                "estimated_arrival_minutes": estimated_minutes
            }

    # ========================================================
    # COMPLETE RESPONSE
    # ========================================================

    return {
        "id": emergency.id,
        "patient_name": emergency.patient_name,
        "phone": emergency.phone,
        "emergency_type": emergency.emergency_type,

        "location": emergency.location,
        "latitude": emergency.latitude,
        "longitude": emergency.longitude,

        "status": emergency.status,
        "severity": emergency.severity,

        "user_id": emergency.user_id,

        "ambulance_id": emergency.ambulance_id,
        "ambulance": ambulance_data,

        "hospital_id": emergency.hospital_id,

        "created_at": emergency.created_at
    }


# ============================================================
# GET ALL EMERGENCIES
# ADMIN ONLY
# ============================================================

@router.get("/emergencies")
def get_emergencies(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Admin"))
):

    emergencies = (
        db.query(Emergency)
        .all()
    )

    return {
        "logged_in_as": current_user.email,

        "emergencies": [
            emergency_response(
                emergency,
                db
            )
            for emergency in emergencies
        ]
    }


# ============================================================
# GET MY EMERGENCIES
# CITIZEN
# ============================================================

@router.get("/emergencies/my")
def get_my_emergencies(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    emergencies = (
        db.query(Emergency)
        .filter(
            Emergency.user_id == current_user.id
        )
        .order_by(
            Emergency.created_at.desc()
        )
        .all()
    )

    return {
        "logged_in_as": current_user.email,

        "emergencies": [
            emergency_response(
                emergency,
                db
            )
            for emergency in emergencies
        ]
    }


# ============================================================
# CREATE EMERGENCY
# ============================================================

@router.post(
    "/emergencies",
    status_code=status.HTTP_201_CREATED
)
def create_emergency(
    emergency: EmergencyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    try:

        # ====================================================
        # 1. AI SEVERITY PREDICTION
        # ====================================================

        severity = predict_severity(
            emergency.emergency_type
        )

        # ====================================================
        # 2. FIND NEAREST AVAILABLE AMBULANCE
        # ====================================================

        assigned_ambulance = find_nearest_ambulance(
            db,
            emergency.latitude,
            emergency.longitude
        )

        # ====================================================
        # 3. FIND NEAREST AVAILABLE HOSPITAL
        # ====================================================

        assigned_hospital = find_nearest_hospital(
            db,
            emergency.latitude,
            emergency.longitude
        )

        # ====================================================
        # 4. DETERMINE STATUS
        # ====================================================

        if assigned_ambulance and assigned_hospital:
            emergency_status = "Assigned"
        else:
            emergency_status = "Pending"

        # ====================================================
        # 5. RESERVE RESOURCES
        # ====================================================

        if assigned_ambulance and assigned_hospital:

            assigned_ambulance.status = "Busy"

            if assigned_hospital.available_beds > 0:
                assigned_hospital.available_beds -= 1
            else:
                assigned_ambulance.status = "Available"
                assigned_ambulance = None
                assigned_hospital = None
                emergency_status = "Pending"

        else:

            assigned_ambulance = None
            assigned_hospital = None

        # ====================================================
        # 6. CREATE EMERGENCY
        # ====================================================

        new_emergency = Emergency(

            patient_name=emergency.patient_name,

            phone=emergency.phone,

            emergency_type=emergency.emergency_type,

            location=emergency.location,

            latitude=emergency.latitude,

            longitude=emergency.longitude,

            severity=severity,

            status=emergency_status,

            user_id=current_user.id,

            ambulance_id=(
                assigned_ambulance.id
                if assigned_ambulance
                else None
            ),

            hospital_id=(
                assigned_hospital.id
                if assigned_hospital
                else None
            )
        )

        db.add(new_emergency)

        # ====================================================
        # 7. COMMIT
        # ====================================================

        db.commit()

        db.refresh(new_emergency)

        # ====================================================
        # 8. RESPONSE
        # ====================================================

        return {
            "message": "Emergency created successfully",

            "ambulance": (
                ambulance_response(
                    assigned_ambulance
                )
                if assigned_ambulance
                else None
            ),

            "hospital": (
                hospital_response(
                    assigned_hospital
                )
                if assigned_hospital
                else None
            ),

            "data": emergency_response(
                new_emergency,
                db
            )
        }

    except Exception as error:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Emergency creation failed: {str(error)}"
        )


# ============================================================
# GET SINGLE EMERGENCY
# ============================================================

@router.get("/emergencies/{emergency_id}")
def get_emergency(
    emergency_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    emergency = (
        db.query(Emergency)
        .filter(
            Emergency.id == emergency_id
        )
        .first()
    )

    if not emergency:

        raise HTTPException(
            status_code=404,
            detail="Emergency not found"
        )

    # ========================================================
    # ACCESS CONTROL
    # ========================================================

    if (
        current_user.role != "Admin"
        and emergency.user_id != current_user.id
    ):

        raise HTTPException(
            status_code=403,
            detail="Access denied"
        )

    return emergency_response(
        emergency,
        db
    )


# ============================================================
# UPDATE EMERGENCY
# ADMIN ONLY
# ============================================================

@router.put("/emergencies/{emergency_id}")
def update_emergency(
    emergency_id: int,
    emergency: EmergencyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Admin"))
):

    db_emergency = (
        db.query(Emergency)
        .filter(
            Emergency.id == emergency_id
        )
        .first()
    )

    if not db_emergency:

        raise HTTPException(
            status_code=404,
            detail="Emergency not found"
        )

    # ========================================================
    # UPDATE STATUS
    # ========================================================

    if emergency.status is not None:

        db_emergency.status = emergency.status

    # ========================================================
    # UPDATE AMBULANCE
    # ========================================================

    if emergency.ambulance_id is not None:

        db_emergency.ambulance_id = (
            emergency.ambulance_id
        )

    # ========================================================
    # UPDATE HOSPITAL
    # ========================================================

    if emergency.hospital_id is not None:

        db_emergency.hospital_id = (
            emergency.hospital_id
        )

    db.commit()

    db.refresh(db_emergency)

    return {
        "message": "Emergency updated successfully",

        "data": emergency_response(
            db_emergency,
            db
        )
    }


# ============================================================
# DELETE EMERGENCY
# ADMIN ONLY
# ============================================================

@router.delete("/emergencies/{emergency_id}")
def delete_emergency(
    emergency_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Admin"))
):

    db_emergency = (
        db.query(Emergency)
        .filter(
            Emergency.id == emergency_id
        )
        .first()
    )

    if not db_emergency:

        raise HTTPException(
            status_code=404,
            detail="Emergency not found"
        )

    # ========================================================
    # RELEASE AMBULANCE
    # ========================================================

    if db_emergency.ambulance_id is not None:

        ambulance = (
            db.query(Ambulance)
            .filter(
                Ambulance.id ==
                db_emergency.ambulance_id
            )
            .first()
        )

        if ambulance:

            ambulance.status = "Available"

    # ========================================================
    # RELEASE HOSPITAL BED
    # ========================================================

    if db_emergency.hospital_id is not None:

        hospital = (
            db.query(Hospital)
            .filter(
                Hospital.id ==
                db_emergency.hospital_id
            )
            .first()
        )

        if hospital:

            hospital.available_beds += 1

    # ========================================================
    # DELETE
    # ========================================================

    db.delete(db_emergency)

    db.commit()

    return {
        "message": "Emergency deleted successfully"
    }


# ============================================================
# COMPLETE EMERGENCY
# ADMIN ONLY
# ============================================================

@router.put("/emergencies/{emergency_id}/complete")
def complete_emergency(
    emergency_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Admin"))
):

    emergency = (
        db.query(Emergency)
        .filter(
            Emergency.id == emergency_id
        )
        .first()
    )

    if not emergency:

        raise HTTPException(
            status_code=404,
            detail="Emergency not found"
        )

    # ========================================================
    # ALREADY COMPLETED
    # ========================================================

    if emergency.status == "Completed":

        raise HTTPException(
            status_code=400,
            detail="Emergency already completed"
        )

    # ========================================================
    # MARK COMPLETED
    # ========================================================

    emergency.status = "Completed"

    # ========================================================
    # RELEASE AMBULANCE
    # ========================================================

    if emergency.ambulance_id is not None:

        ambulance = (
            db.query(Ambulance)
            .filter(
                Ambulance.id ==
                emergency.ambulance_id
            )
            .first()
        )

        if ambulance:

            ambulance.status = "Available"

    # ========================================================
    # RELEASE HOSPITAL BED
    # ========================================================

    if emergency.hospital_id is not None:

        hospital = (
            db.query(Hospital)
            .filter(
                Hospital.id ==
                emergency.hospital_id
            )
            .first()
        )

        if hospital:

            hospital.available_beds += 1

    # ========================================================
    # COMMIT
    # ========================================================

    db.commit()

    db.refresh(emergency)

    return {
        "message": "Emergency completed successfully",

        "data": emergency_response(
            emergency,
            db
        )
    }