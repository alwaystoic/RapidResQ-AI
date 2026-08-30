from sqlalchemy.orm import Session

from backend.models.ambulance import Ambulance
from backend.models.emergency import Emergency
from backend.utils.distance import haversine_distance


# ============================================================
# AMBULANCE AVERAGE SPEED
# ============================================================

AVERAGE_AMBULANCE_SPEED_KMPH = 40


# ============================================================
# FIND NEAREST AVAILABLE AMBULANCE
# ============================================================

def find_nearest_ambulance(
    db: Session,
    emergency_latitude: float,
    emergency_longitude: float,
):
    """
    Find the nearest ambulance whose status is Available.

    This function only searches.
    It does not modify or commit the database.
    """

    available_ambulances = (
        db.query(Ambulance)
        .filter(Ambulance.status == "Available")
        .all()
    )

    if not available_ambulances:
        return None

    nearest = None
    shortest_distance = float("inf")

    for ambulance in available_ambulances:

        distance = haversine_distance(
            emergency_latitude,
            emergency_longitude,
            ambulance.latitude,
            ambulance.longitude,
        )

        if distance < shortest_distance:
            shortest_distance = distance
            nearest = ambulance

    return nearest


# ============================================================
# ASSIGN AMBULANCE TO ONE EMERGENCY
# ============================================================

def assign_ambulance_to_next_emergency(
    db: Session,
    ambulance: Ambulance,
):
    """
    Assign an available ambulance to the highest-priority
    pending emergency.

    Priority order:
        1. priority_score DESC
        2. created_at ASC

    This means:
        Critical emergencies are handled first.
        If priorities are equal, older emergencies are handled first.

    Returns:
        Assigned Emergency object
        OR None if no pending emergency exists.
    """

    if not ambulance:
        return None

    # --------------------------------------------------------
    # Ambulance must be available
    # --------------------------------------------------------

    if ambulance.status != "Available":
        return None

    # --------------------------------------------------------
    # Find next pending emergency
    # --------------------------------------------------------

    emergency = (
        db.query(Emergency)
        .filter(
            Emergency.status == "Pending",
            Emergency.ambulance_id.is_(None),
        )
        .order_by(
            Emergency.priority_score.desc(),
            Emergency.created_at.asc(),
        )
        .first()
    )

    if not emergency:
        return None

    # --------------------------------------------------------
    # Assign ambulance
    # --------------------------------------------------------

    ambulance.status = "Busy"

    emergency.ambulance_id = ambulance.id

    # Only mark Assigned when the emergency already has
    # a hospital assigned.
    #
    # If hospital assignment is handled separately,
    # it can remain Pending until both resources exist.

    if emergency.hospital_id is not None:
        emergency.status = "Assigned"

    return emergency


# ============================================================
# ASSIGN NEXT PENDING EMERGENCY
# COMPATIBILITY ALIAS
# ============================================================

def assign_next_pending_emergency(
    db: Session,
    ambulance: Ambulance,
):
    """
    Backwards-compatible function name.

    Existing routers can continue using
    assign_next_pending_emergency().
    """

    return assign_ambulance_to_next_emergency(
        db,
        ambulance,
    )


# ============================================================
# DISPATCH AVAILABLE AMBULANCES
# ============================================================

def dispatch_available_ambulances(
    db: Session,
):
    """
    Automatically assign available ambulances to pending
    emergencies.

    Each available ambulance is assigned to the next
    highest-priority pending emergency.

    Returns a list of assigned emergencies.
    """

    available_ambulances = (
        db.query(Ambulance)
        .filter(
            Ambulance.status == "Available"
        )
        .all()
    )

    assigned_emergencies = []

    for ambulance in available_ambulances:

        emergency = assign_ambulance_to_next_emergency(
            db,
            ambulance,
        )

        if emergency:
            assigned_emergencies.append(
                emergency
            )

    return assigned_emergencies


# ============================================================
# CALCULATE AMBULANCE DISTANCE
# ============================================================

def calculate_ambulance_distance(
    ambulance: Ambulance,
    emergency_latitude: float,
    emergency_longitude: float,
):
    """
    Calculate straight-line distance between an ambulance
    and emergency location.

    Returns kilometres rounded to one decimal place.
    """

    if not ambulance:
        return None

    distance = haversine_distance(
        ambulance.latitude,
        ambulance.longitude,
        emergency_latitude,
        emergency_longitude,
    )

    return round(distance, 1)


# ============================================================
# CALCULATE ETA
# ============================================================

def calculate_eta_minutes(
    distance_km: float,
    speed_kmph: float = AVERAGE_AMBULANCE_SPEED_KMPH,
):
    """
    Calculate estimated ambulance arrival time.
    """

    if distance_km is None:
        return None

    if distance_km <= 0:
        return 0

    if speed_kmph <= 0:
        return None

    eta_hours = distance_km / speed_kmph

    eta_minutes = eta_hours * 60

    return max(1, round(eta_minutes))