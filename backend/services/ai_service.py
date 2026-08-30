# =========================================================
# RapidResQ-AI — AI Emergency Intelligence Service
# =========================================================


# =========================================================
# SEVERITY PREDICTION
# =========================================================

def predict_severity(emergency_type: str) -> str:
    """
    Rule-based AI severity prediction.

    The function classifies an emergency into:
    Critical, High, Medium, or Low.

    This function is intentionally kept compatible with
    the existing emergency router.
    """

    emergency = emergency_type.strip().lower()

    critical = [
        "cardiac arrest",
        "heart attack",
        "stroke",
        "severe bleeding",
        "gunshot",
        "major accident",
        "unconscious",
    ]

    high = [
        "accident",
        "fracture",
        "chest pain",
        "burn",
        "electric shock",
    ]

    medium = [
        "fever",
        "vomiting",
        "infection",
        "stomach pain",
        "dehydration",
    ]

    low = [
        "cut",
        "headache",
        "cold",
        "cough",
        "minor injury",
    ]

    if emergency in critical:
        return "Critical"

    if emergency in high:
        return "High"

    if emergency in medium:
        return "Medium"

    if emergency in low:
        return "Low"

    # Unknown emergency types are treated as Medium
    # so that they are not ignored.
    return "Medium"


# =========================================================
# PRIORITY SCORE
# =========================================================

def get_priority_score(severity: str) -> int:
    """
    Convert AI severity into a numerical priority score.

    Critical -> 100
    High     -> 75
    Medium   -> 50
    Low      -> 25
    """

    priority_scores = {
        "critical": 100,
        "high": 75,
        "medium": 50,
        "low": 25,
    }

    return priority_scores.get(
        severity.strip().lower(),
        50,
    )


# =========================================================
# EXPLAINABLE AI REASON
# =========================================================

def get_severity_reason(
    emergency_type: str,
    severity: str,
) -> str:
    """
    Generate a human-readable explanation for the
    predicted emergency severity.
    """

    emergency = emergency_type.strip().lower()

    reasons = {
        "cardiac arrest":
            "Cardiac arrest is a life-threatening emergency requiring immediate response.",

        "heart attack":
            "Heart attack can be life-threatening and requires immediate medical attention.",

        "stroke":
            "Stroke requires rapid medical intervention to reduce the risk of permanent damage.",

        "severe bleeding":
            "Severe bleeding can rapidly become life-threatening without immediate treatment.",

        "gunshot":
            "A gunshot injury may involve severe trauma and requires immediate emergency response.",

        "major accident":
            "A major accident may involve severe trauma and requires immediate emergency response.",

        "unconscious":
            "Unconsciousness may indicate a serious medical condition requiring immediate assessment.",

        "accident":
            "An accident may involve significant injury and requires prompt medical attention.",

        "fracture":
            "A fracture requires medical assessment and treatment to prevent further complications.",

        "chest pain":
            "Chest pain may indicate a serious cardiovascular condition and requires prompt assessment.",

        "burn":
            "Burn injuries may require urgent medical treatment depending on their severity.",

        "electric shock":
            "Electric shock can cause serious internal injuries and requires medical evaluation.",

        "fever":
            "Fever is generally a moderate medical concern but may require assessment depending on symptoms.",

        "vomiting":
            "Persistent vomiting can cause dehydration and may require medical assessment.",

        "infection":
            "An infection may require medical treatment depending on its severity and progression.",

        "stomach pain":
            "Stomach pain can have multiple causes and may require medical assessment.",

        "dehydration":
            "Dehydration can become serious if untreated, especially when symptoms are significant.",

        "cut":
            "A minor cut is generally a low-severity injury when there is no significant bleeding.",

        "headache":
            "A typical headache is generally a low-severity condition when no severe symptoms are present.",

        "cold":
            "A common cold is generally a low-severity condition.",

        "cough":
            "A typical cough is generally a low-severity condition when no serious symptoms are present.",

        "minor injury":
            "A minor injury is generally a low-severity emergency when there are no serious symptoms.",
    }

    if emergency in reasons:
        return reasons[emergency]

    # Explanation for unknown emergency types
    severity_reasons = {
        "Critical":
            "The emergency was classified as critical and should receive immediate attention.",

        "High":
            "The emergency was classified as high severity and should receive prompt attention.",

        "Medium":
            "The emergency was classified as medium severity and should receive appropriate medical attention.",

        "Low":
            "The emergency was classified as low severity based on the available information.",
    }

    return severity_reasons.get(
        severity,
        "Severity was determined from the available emergency information.",
    )


# =========================================================
# COMPLETE AI ANALYSIS
# =========================================================

def analyze_emergency(emergency_type: str) -> dict:
    """
    Perform complete rule-based AI analysis.

    Returns:
        severity
        priority_score
        reason
    """

    severity = predict_severity(emergency_type)

    priority_score = get_priority_score(severity)

    reason = get_severity_reason(
        emergency_type,
        severity,
    )

    return {
        "severity": severity,
        "priority_score": priority_score,
        "reason": reason,
    }