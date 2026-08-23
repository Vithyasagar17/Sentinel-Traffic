from trend import counts_by_camera_and_window, compute_trend
from load_fixtures import load_events

# Configurable thresholds — tune these freely, logic below never changes.
COUNT_THRESHOLDS = {
    "HIGH": 3,    # count >= 3 in the latest window -> contributes to HIGH
    "MEDIUM": 2,  # count >= 2 -> contributes to MEDIUM
}
TREND_THRESHOLDS = {
    "HIGH": 0.4,    # trend >= 0.4 (40% rise) -> contributes to HIGH
    "MEDIUM": 0.1,  # trend >= 0.1 (10% rise) -> contributes to MEDIUM
}


def classify_risk(latest_count, trend):
    """
    Deterministic, explainable risk classification.
    Risk is HIGH if EITHER the count is high OR the trend is rising sharply.
    Risk is MEDIUM if either signal is moderate.
    Otherwise LOW.
    """
    if latest_count >= COUNT_THRESHOLDS["HIGH"] or trend >= TREND_THRESHOLDS["HIGH"]:
        return "HIGH"
    if latest_count >= COUNT_THRESHOLDS["MEDIUM"] or trend >= TREND_THRESHOLDS["MEDIUM"]:
        return "MEDIUM"
    return "LOW"


def build_risk_output(camera_id, windows):
    """Builds the exact output contract from the project spec."""
    sorted_windows = sorted(windows.items())
    latest_count = sorted_windows[-1][1] if sorted_windows else 0
    trend = compute_trend(windows)
    risk = classify_risk(latest_count, trend)

    return {
        "camera_id": camera_id,
        "vehicle_count": latest_count,
        "trend": trend,
        "risk": risk,
    }


if __name__ == "__main__":
    events = load_events()
    buckets = counts_by_camera_and_window(events)

    for camera_id, windows in buckets.items():
        output = build_risk_output(camera_id, windows)
        print(output)