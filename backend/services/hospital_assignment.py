from sqlalchemy.orm import Session

from backend.models.hospital import Hospital
from backend.utils.distance import haversine_distance


def assign_hospital(
    db: Session,
    emergency_latitude: float,
    emergency_longitude: float
):
    """
    Assign the nearest hospital that has available beds.
    """

    available_hospitals = (
        db.query(Hospital)
        .filter(Hospital.available_beds > 0)
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

    nearest.available_beds -= 1

    db.commit()
    db.refresh(nearest)

    return nearest