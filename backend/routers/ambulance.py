from fastapi import APIRouter, Depends, Query, status, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from backend.database.database import get_db

from backend.models.ambulance import Ambulance
from backend.models.emergency import Emergency
from backend.models.user import User

from backend.schemas.ambulance import AmbulanceCreate

from backend.auth.dependencies import get_current_user
from backend.auth.roles import require_role

from backend.services.assignment_service import (
    assign_ambulance_to_next_emergency,
)


router = APIRouter()


# ============================================================
# AMBULANCE RESPONSE
# ============================================================

def ambulance_response(ambulance):
    """
    Convert an Ambulance model into an API response.
    """

    return {
        "id": ambulance.id,
        "vehicle": ambulance.vehicle,
        "location": ambulance.location,
        "latitude": ambulance.latitude,
        "longitude": ambulance.longitude,
        "status": ambulance.status,
    }


# ============================================================
# CHECK ACTIVE EMERGENCY
# ============================================================

def get_active_emergency_for_ambulance(
    db: Session,
    ambulance_id: int,
):
    """
    Return the active emergency assigned to an ambulance.

    Completed emergencies are ignored.
    """

    return (
        db.query(Emergency)
        .filter(
            Emergency.ambulance_id == ambulance_id,
            Emergency.status != "Completed",
        )
        .first()
    )


# ============================================================
# GET ALL AMBULANCES
# CITIZEN + ADMIN
# ============================================================

@router.get("/ambulances")
def get_ambulances(
    status: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get all ambulances.

    Optional:
        /ambulances?status=Available
    """

    query = db.query(Ambulance)

    if status:
        query = query.filter(
            Ambulance.status == status
        )

    ambulances = query.all()

    return {
        "logged_in_as": current_user.email,
        "ambulances": [
            ambulance_response(ambulance)
            for ambulance in ambulances
        ],
    }


# ============================================================
# GET SINGLE AMBULANCE
# CITIZEN + ADMIN
# ============================================================

@router.get("/ambulances/{ambulance_id}")
def get_ambulance(
    ambulance_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get one ambulance by ID.
    """

    ambulance = (
        db.query(Ambulance)
        .filter(
            Ambulance.id == ambulance_id
        )
        .first()
    )

    if not ambulance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ambulance not found",
        )

    return ambulance_response(ambulance)


# ============================================================
# CREATE AMBULANCE
# ADMIN ONLY
# ============================================================

@router.post(
    "/ambulances",
    status_code=status.HTTP_201_CREATED,
)
def create_ambulance(
    ambulance: AmbulanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Admin")),
):
    """
    Create a new ambulance.

    If it is created as Available, it is automatically
    assigned to the next pending emergency.
    """

    # --------------------------------------------------------
    # Check duplicate vehicle
    # --------------------------------------------------------

    existing_vehicle = (
        db.query(Ambulance)
        .filter(
            Ambulance.vehicle == ambulance.vehicle
        )
        .first()
    )

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

    assigned_emergency = None

    try:
        db.add(new_ambulance)

        # Get generated ambulance ID.
        db.flush()

        # ----------------------------------------------------
        # AUTOMATIC DISPATCH
        # ----------------------------------------------------

        if new_ambulance.status == "Available":

            assigned_emergency = (
                assign_ambulance_to_next_emergency(
                    db,
                    new_ambulance,
                )
            )

        db.commit()

        db.refresh(new_ambulance)

        if assigned_emergency:
            db.refresh(assigned_emergency)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Unable to create ambulance. "
                "Vehicle may already exist."
            ),
        )

    except Exception as error:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "An unexpected error occurred while "
                f"creating the ambulance: {str(error)}"
            ),
        )

    return {
        "message": "Ambulance created successfully",

        "data": ambulance_response(
            new_ambulance
        ),

        "assigned_emergency_id": (
            assigned_emergency.id
            if assigned_emergency
            else None
        ),
    }


# ============================================================
# UPDATE AMBULANCE
# ADMIN ONLY
# ============================================================

@router.put("/ambulances/{ambulance_id}")
def update_ambulance(
    ambulance_id: int,
    ambulance: AmbulanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Admin")),
):
    """
    Update an ambulance.

    When an ambulance becomes Available, the next pending
    emergency is automatically assigned to it.
    """

    db_ambulance = (
        db.query(Ambulance)
        .filter(
            Ambulance.id == ambulance_id
        )
        .first()
    )

    if not db_ambulance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ambulance not found",
        )

    # --------------------------------------------------------
    # Check duplicate vehicle
    # --------------------------------------------------------

    existing_vehicle = (
        db.query(Ambulance)
        .filter(
            Ambulance.vehicle == ambulance.vehicle,
            Ambulance.id != ambulance_id,
        )
        .first()
    )

    if existing_vehicle:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vehicle already registered",
        )

    old_status = db_ambulance.status
    requested_status = ambulance.status

    # ========================================================
    # PREVENT MANUAL RELEASE OF BUSY AMBULANCE
    # ========================================================

    if (
        old_status == "Busy"
        and requested_status == "Available"
    ):

        active_emergency = (
            get_active_emergency_for_ambulance(
                db,
                db_ambulance.id,
            )
        )

        if active_emergency:

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "This ambulance is currently assigned "
                    f"to emergency #{active_emergency.id}. "
                    "Complete the emergency first."
                ),
            )

    # ========================================================
    # UPDATE AMBULANCE
    # ========================================================

    db_ambulance.vehicle = ambulance.vehicle
    db_ambulance.status = requested_status
    db_ambulance.location = ambulance.location
    db_ambulance.latitude = ambulance.latitude
    db_ambulance.longitude = ambulance.longitude

    assigned_emergency = None

    try:

        # ====================================================
        # AUTOMATIC DISPATCH
        # ====================================================

        if requested_status == "Available":

            assigned_emergency = (
                assign_ambulance_to_next_emergency(
                    db,
                    db_ambulance,
                )
            )

        # ====================================================
        # COMMIT
        # ====================================================

        db.commit()

        db.refresh(db_ambulance)

        if assigned_emergency:
            db.refresh(assigned_emergency)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Unable to update ambulance. "
                "Vehicle may already exist."
            ),
        )

    except Exception as error:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "An unexpected error occurred while "
                f"updating the ambulance: {str(error)}"
            ),
        )

    return {
        "message": "Ambulance updated successfully",

        "data": ambulance_response(
            db_ambulance
        ),

        "assigned_emergency_id": (
            assigned_emergency.id
            if assigned_emergency
            else None
        ),
    }


# ============================================================
# DELETE AMBULANCE
# ADMIN ONLY
# ============================================================

@router.delete("/ambulances/{ambulance_id}")
def delete_ambulance(
    ambulance_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("Admin")),
):
    """
    Delete an ambulance.

    An ambulance currently handling an emergency cannot
    be deleted.
    """

    db_ambulance = (
        db.query(Ambulance)
        .filter(
            Ambulance.id == ambulance_id
        )
        .first()
    )

    if not db_ambulance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ambulance not found",
        )

    # --------------------------------------------------------
    # Prevent deleting an active ambulance
    # --------------------------------------------------------

    active_emergency = (
        get_active_emergency_for_ambulance(
            db,
            db_ambulance.id,
        )
    )

    if active_emergency:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Cannot delete ambulance because it is "
                f"currently assigned to emergency "
                f"#{active_emergency.id}."
            ),
        )

    try:

        db.delete(db_ambulance)

        db.commit()

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Cannot delete this ambulance because "
                "it is associated with an emergency."
            ),
        )

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete ambulance.",
        )

    return {
        "message": "Ambulance deleted successfully",
    }