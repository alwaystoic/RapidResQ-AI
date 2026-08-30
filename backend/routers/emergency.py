from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database.database import get_db

from backend.models.emergency import Emergency
from backend.models.user import User
from backend.models.ambulance import Ambulance
from backend.models.hospital import Hospital

from backend.schemas.emergency import (
    EmergencyCreate,
    EmergencyUpdate,
)

from backend.auth.dependencies import get_current_user
from backend.auth.roles import require_role

from backend.services.ai_service import analyze_emergency
from backend.services.assignment_service import (
    find_nearest_ambulance,
    assign_ambulance_to_next_emergency,
    dispatch_available_ambulances,
)
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
    - AI severity
    - AI priority score
    - AI explanation
    - Assigned ambulance
    - Ambulance distance
    - Estimated arrival time
    - Assigned hospital
    """

    ambulance_data = None

    # ========================================================
    # AI ANALYSIS
    # ========================================================

    ai_analysis = analyze_emergency(
        emergency.emergency_type
    )

    severity = ai_analysis.get(
        "severity",
        emergency.severity
    )

    priority_score = ai_analysis.get(
        "priority_score",
        getattr(emergency, "priority_score", 50)
    )

    ai_reason = ai_analysis.get(
        "reason",
        getattr(
            emergency,
            "ai_reason",
            "Emergency classified based on available information."
        )
    )

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

            distance = haversine_distance(
                emergency.latitude,
                emergency.longitude,
                ambulance.latitude,
                ambulance.longitude
            )

            estimated_minutes = round(
                (distance / 40) * 60
            )

            if distance > 0 and estimated_minutes < 1:
                estimated_minutes = 1

            ambulance_data = {
                "id": ambulance.id,
                "vehicle": ambulance.vehicle,
                "status": ambulance.status,
                "location": ambulance.location,
                "latitude": ambulance.latitude,
                "longitude": ambulance.longitude,
                "distance_km": round(distance, 2),
                "estimated_arrival_minutes": estimated_minutes,
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

        "severity": severity,
        "priority_score": priority_score,
        "ai_reason": ai_reason,

        "user_id": emergency.user_id,

        "ambulance_id": emergency.ambulance_id,
        "ambulance": ambulance_data,

        "hospital_id": emergency.hospital_id,

        "created_at": emergency.created_at,
    }


# ============================================================
# GET ALL EMERGENCIES
# ADMIN ONLY
# ============================================================

@router.get("/emergencies")
def get_emergencies(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Admin")),
):

    emergencies = (
        db.query(Emergency)
        .order_by(
            Emergency.priority_score.desc(),
            Emergency.created_at.asc()
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
        ],
    }


# ============================================================
# GET MY EMERGENCIES
# CITIZEN
# ============================================================

@router.get("/emergencies/my")
def get_my_emergencies(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
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
        ],
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
    current_user: User = Depends(get_current_user),
):

    try:

        # ====================================================
        # 1. AI EMERGENCY ANALYSIS
        # ====================================================

        ai_analysis = analyze_emergency(
            emergency.emergency_type
        )

        severity = ai_analysis.get(
            "severity",
            "Medium"
        )

        priority_score = ai_analysis.get(
            "priority_score",
            50
        )

        ai_reason = ai_analysis.get(
            "reason",
            "Emergency classified based on available information."
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
        # 4. CHECK HOSPITAL BED
        # ====================================================

        if (
            assigned_hospital
            and assigned_hospital.available_beds <= 0
        ):
            assigned_hospital = None

        # ====================================================
        # 5. DETERMINE STATUS
        # ====================================================

        if assigned_ambulance and assigned_hospital:
            emergency_status = "Assigned"
        else:
            emergency_status = "Pending"

        # ====================================================
        # 6. RESERVE RESOURCES
        # ====================================================

        if assigned_ambulance and assigned_hospital:

            assigned_ambulance.status = "Busy"

            assigned_hospital.available_beds -= 1

        else:

            assigned_ambulance = None
            assigned_hospital = None

        # ====================================================
        # 7. CREATE EMERGENCY
        # ====================================================

        new_emergency = Emergency(

            patient_name=emergency.patient_name,

            phone=emergency.phone,

            emergency_type=emergency.emergency_type,

            location=emergency.location,

            latitude=emergency.latitude,

            longitude=emergency.longitude,

            severity=severity,

            priority_score=priority_score,

            ai_reason=ai_reason,

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
            ),
        )

        db.add(new_emergency)

        # ====================================================
        # 8. COMMIT
        # ====================================================

        db.commit()

        db.refresh(new_emergency)

        # ====================================================
        # 9. RESPONSE
        # ====================================================

        return {

            "message": "Emergency created successfully",

            "ai_analysis": {
                "severity": severity,
                "priority_score": priority_score,
                "reason": ai_reason,
            },

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
            ),
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
    current_user: User = Depends(get_current_user),
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
    current_user: User = Depends(require_role("Admin")),
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

    if db_emergency.status == "Completed":

        raise HTTPException(
            status_code=400,
            detail="Completed emergency cannot be modified"
        )

    # ========================================================
    # STATUS UPDATE
    # ========================================================

    if emergency.status is not None:

        if emergency.status not in {
            "Pending",
            "Assigned"
        }:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Invalid status. Allowed values: "
                    "Pending, Assigned."
                )
            )

        current_status = db_emergency.status

        if (
            current_status == "Pending"
            and emergency.status != "Assigned"
        ):

            raise HTTPException(
                status_code=400,
                detail=(
                    "Pending emergency can only be "
                    "changed to Assigned"
                )
            )

        if (
            current_status == "Assigned"
            and emergency.status != "Pending"
        ):

            raise HTTPException(
                status_code=400,
                detail=(
                    "Assigned emergency can only be "
                    "changed to Pending. "
                    "Use the complete endpoint to "
                    "mark it Completed."
                )
            )

        db_emergency.status = emergency.status

    # ========================================================
    # AMBULANCE REASSIGNMENT
    # ========================================================

    if emergency.ambulance_id is not None:

        if emergency.ambulance_id != db_emergency.ambulance_id:

            new_ambulance = (
                db.query(Ambulance)
                .filter(
                    Ambulance.id ==
                    emergency.ambulance_id
                )
                .first()
            )

            if not new_ambulance:

                raise HTTPException(
                    status_code=404,
                    detail="Selected ambulance not found"
                )

            if new_ambulance.status != "Available":

                raise HTTPException(
                    status_code=400,
                    detail="Selected ambulance is not available"
                )

            # Release old ambulance

            if db_emergency.ambulance_id is not None:

                old_ambulance = (
                    db.query(Ambulance)
                    .filter(
                        Ambulance.id ==
                        db_emergency.ambulance_id
                    )
                    .first()
                )

                if old_ambulance:

                    old_ambulance.status = "Available"

            # Reserve new ambulance

            new_ambulance.status = "Busy"

            db_emergency.ambulance_id = new_ambulance.id

    # ========================================================
    # HOSPITAL REASSIGNMENT
    # ========================================================

    if emergency.hospital_id is not None:

        if emergency.hospital_id != db_emergency.hospital_id:

            new_hospital = (
                db.query(Hospital)
                .filter(
                    Hospital.id ==
                    emergency.hospital_id
                )
                .first()
            )

            if not new_hospital:

                raise HTTPException(
                    status_code=404,
                    detail="Selected hospital not found"
                )

            if new_hospital.status != "Available":

                raise HTTPException(
                    status_code=400,
                    detail="Selected hospital is not available"
                )

            if new_hospital.available_beds <= 0:

                raise HTTPException(
                    status_code=400,
                    detail="Selected hospital has no available beds"
                )

            # Release old hospital bed

            if db_emergency.hospital_id is not None:

                old_hospital = (
                    db.query(Hospital)
                    .filter(
                        Hospital.id ==
                        db_emergency.hospital_id
                    )
                    .first()
                )

                if old_hospital:

                    old_hospital.available_beds += 1

            # Reserve new hospital bed

            new_hospital.available_beds -= 1

            db_emergency.hospital_id = new_hospital.id

    # ========================================================
    # AUTOMATIC STATUS
    # ========================================================

    if (
        db_emergency.ambulance_id is not None
        and db_emergency.hospital_id is not None
        and db_emergency.status == "Pending"
    ):

        db_emergency.status = "Assigned"

    # ========================================================
    # SAVE
    # ========================================================

    try:

        db.commit()

        db.refresh(db_emergency)

    except Exception:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Failed to update emergency"
        )

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
    current_user: User = Depends(require_role("Admin")),
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

    released_ambulance = None

    if db_emergency.ambulance_id is not None:

        released_ambulance = (
            db.query(Ambulance)
            .filter(
                Ambulance.id ==
                db_emergency.ambulance_id
            )
            .first()
        )

        if released_ambulance:

            released_ambulance.status = "Available"

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
    # AUTOMATICALLY ASSIGN RELEASED AMBULANCE
    # ========================================================

    next_emergency = None

    if released_ambulance:

        next_emergency = assign_ambulance_to_next_emergency(
            db,
            released_ambulance
        )

    # ========================================================
    # DELETE
    # ========================================================

    try:

        db.delete(db_emergency)

        db.commit()

    except Exception:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Failed to delete emergency"
        )

    return {
        "message": "Emergency deleted successfully",

        "next_emergency_assigned": (
            next_emergency.id
            if next_emergency
            else None
        ),
    }


# ============================================================
# COMPLETE EMERGENCY
# ADMIN ONLY
#
# IMPORTANT:
# When the ambulance becomes available, the system
# automatically assigns it to the next pending emergency.
# ============================================================

@router.put("/emergencies/{emergency_id}/complete")
def complete_emergency(
    emergency_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Admin")),
):

    # ========================================================
    # FIND EMERGENCY
    # ========================================================

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

    try:

        # ====================================================
        # SAVE AMBULANCE REFERENCE
        # ====================================================

        released_ambulance = None

        if emergency.ambulance_id is not None:

            released_ambulance = (
                db.query(Ambulance)
                .filter(
                    Ambulance.id ==
                    emergency.ambulance_id
                )
                .first()
            )

        # ====================================================
        # RELEASE AMBULANCE
        # ====================================================

        if released_ambulance:

            if released_ambulance.status == "Busy":

                released_ambulance.status = "Available"

        # ====================================================
        # RELEASE HOSPITAL BED
        # ====================================================

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

        # ====================================================
        # MARK CURRENT EMERGENCY COMPLETED
        # ====================================================

        emergency.status = "Completed"

        # ====================================================
        # AUTOMATICALLY ASSIGN RELEASED AMBULANCE
        #
        # Priority:
        #   1. Critical
        #   2. High
        #   3. Medium
        #   4. Low
        #
        # If same priority:
        # oldest emergency first.
        # ====================================================

        assigned_next_emergency = None

        if released_ambulance:

            assigned_next_emergency = (
                assign_ambulance_to_next_emergency(
                    db,
                    released_ambulance
                )
            )

        # ====================================================
        # COMMIT EVERYTHING TOGETHER
        # ====================================================

        db.commit()

        db.refresh(emergency)

        if assigned_next_emergency:

            db.refresh(
                assigned_next_emergency
            )

        # ====================================================
        # RESPONSE
        # ====================================================

        return {

            "message": "Emergency completed successfully",

            "ambulance_released": (
                released_ambulance.id
                if released_ambulance
                else None
            ),

            "next_emergency_assigned": (
                assigned_next_emergency.id
                if assigned_next_emergency
                else None
            ),

            "data": emergency_response(
                emergency,
                db
            ),

            "next_emergency": (
                emergency_response(
                    assigned_next_emergency,
                    db
                )
                if assigned_next_emergency
                else None
            ),
        }

    except Exception as error:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to complete emergency: "
                f"{str(error)}"
            )
        )