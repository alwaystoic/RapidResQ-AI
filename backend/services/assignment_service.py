from sqlalchemy.orm import Session

from backend.models.ambulance import Ambulance
from backend.utils.distance import haversine_distance


def assign_ambulance(
    db: Session,
    emergency_latitude: float,
    emergency_longitude: float
):
    """
    Assign the nearest available ambulance.
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

    nearest.status = "Busy"

    db.commit()
    db.refresh(nearest)

    return nearest