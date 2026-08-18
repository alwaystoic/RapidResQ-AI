from sqlalchemy.orm import Session

from backend.models.hospital import Hospital
from backend.utils.distance import haversine_distance


def find_nearest_hospital(
    db: Session,
    emergency_latitude: float,
    emergency_longitude: float
):
    """
    Find the nearest available hospital that has at least one
    available bed.

    This function only finds the hospital.
    It does NOT modify the database or commit a transaction.
    """

    available_hospitals = (
        db.query(Hospital)
        .filter(
            Hospital.status == "Available",
            Hospital.available_beds > 0
        )
        .all()
    )

    if not available_hospitals:
        return None

    nearest = None
    shortest_distance = float("inf")

    for hospital in available_hospitals:

        distance = haversine_distance(
            emergency_latitude,
            emergency_longitude,
            hospital.latitude,
            hospital.longitude
        )

        if distance < shortest_distance:
            shortest_distance = distance
            nearest = hospital

    return nearest