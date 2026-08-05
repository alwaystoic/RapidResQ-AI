from sqlalchemy.orm import Session

from backend.models.ambulance import Ambulance


def assign_ambulance(db: Session):
    """
    Find the first available ambulance.
    Later this will use GPS distance and AI optimization.
    """

    ambulance = (
        db.query(Ambulance)
        .filter(Ambulance.status == "Available")
        .first()
    )

    if ambulance is None:
        return None

    ambulance.status = "Busy"

    db.commit()
    db.refresh(ambulance)

    return ambulance