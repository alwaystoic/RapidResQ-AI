from sqlalchemy.orm import Session

from backend.models.ambulance import Ambulance
from backend.utils.distance import haversine_distance


# ==========================================
# AMBULANCE AVERAGE SPEED
# ==========================================

AVERAGE_AMBULANCE_SPEED_KMPH = 40


# ==========================================
# FIND NEAREST AVAILABLE AMBULANCE
# ==========================================

def find_nearest_ambulance(
    db: Session,
    emergency_latitude: float,
    emergency_longitude: float
):
    """
    Find the nearest available ambulance.

    This function only finds the ambulance.
    It does NOT modify the database or commit a transaction.
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
            ambulance.longitude
        )

        if distance < shortest_distance:
            shortest_distance = distance
            nearest = ambulance

    return nearest


# ==========================================
# CALCULATE DISTANCE TO EMERGENCY
# ==========================================

def calculate_ambulance_distance(
    ambulance: Ambulance,
    emergency_latitude: float,
    emergency_longitude: float
):
    """
    Calculate the straight-line distance between
    the ambulance and the emergency location.

    Returns distance in kilometres.
    """

    if not ambulance:
        return None

    distance = haversine_distance(
        ambulance.latitude,
        ambulance.longitude,
        emergency_latitude,
        emergency_longitude
    )

    return round(distance, 1)


# ==========================================
# CALCULATE ESTIMATED ARRIVAL TIME
# ==========================================

def calculate_eta_minutes(
    distance_km: float,
    speed_kmph: float = AVERAGE_AMBULANCE_SPEED_KMPH
):
    """
    Calculate estimated ambulance arrival time.

    ETA is based on an average ambulance speed.
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