def predict_severity(emergency_type: str) -> str:
    """
    Rule-based AI severity prediction.
    Later this function can be replaced with an ML model or LLM.
    """

    emergency = emergency_type.lower()

    critical = [
        "cardiac arrest",
        "heart attack",
        "stroke",
        "severe bleeding",
        "gunshot",
        "major accident",
        "unconscious"
    ]

    high = [
        "accident",
        "fracture",
        "chest pain",
        "burn",
        "electric shock"
    ]

    medium = [
        "fever",
        "vomiting",
        "infection",
        "stomach pain",
        "dehydration"
    ]

    low = [
        "cut",
        "headache",
        "cold",
        "cough",
        "minor injury"
    ]

    if emergency in critical:
        return "Critical"

    if emergency in high:
        return "High"

    if emergency in medium:
        return "Medium"

    if emergency in low:
        return "Low"

    return "Medium"