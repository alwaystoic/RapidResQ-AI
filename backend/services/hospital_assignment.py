from sqlalchemy.orm import Session

from backend.models.hospital import Hospital


def assign_hospital(db: Session):
    """
    Find the first available hospital with at least one bed.
    Later this will use AI + GPS + specialty matching.
    """

    hospital = (
        db.query(Hospital)
        .filter(
            Hospital.status == "Available",
            Hospital.available_beds > 0
        )
        .first()
    )

    if hospital is None:
        return None

    # Reserve one bed
    hospital.available_beds -= 1

    # Mark hospital full if no beds remain
    if hospital.available_beds == 0:
        hospital.status = "Full"

    db.commit()
    db.refresh(hospital)

    return hospital