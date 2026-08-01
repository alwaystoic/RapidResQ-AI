from fastapi import APIRouter, Query

router = APIRouter()


@router.get("/ambulances")
def get_ambulances(status: str | None = Query(default=None)):
    ambulances = [
        {
            "id": 1,
            "vehicle": "AMB-101",
            "status": "Available",
            "location": "Shivajinagar"
        },
        {
            "id": 2,
            "vehicle": "AMB-102",
            "status": "On Duty",
            "location": "Kothrud"
        }
    ]

    if status:
        ambulances = [
            ambulance
            for ambulance in ambulances
            if ambulance["status"].lower() == status.lower()
        ]

    return {"ambulances": ambulances}


@router.get("/ambulances/{ambulance_id}")
def get_ambulance(ambulance_id: int):
    return {
        "id": ambulance_id,
        "vehicle": f"AMB-{100 + ambulance_id}",
        "status": "Available",
        "location": "Pune"
    }