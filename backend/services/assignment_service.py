from sqlalchemy.orm import Session

from backend.models.ambulance import Ambulance
from backend.utils.distance import haversine_distance


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