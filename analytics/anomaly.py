import json
import math
from datetime import datetime
from pathlib import Path

FIXTURE_PATH = Path(__file__).parent / "fixtures" / "trajectory_fixture.json"

# Configurable threshold — max plausible speed in km/h.
# Set conservatively above any real urban vehicle speed.
MAX_PLAUSIBLE_SPEED_KMH = 160


def load_trajectory_fixture():
    with open(FIXTURE_PATH, "r") as f:
        return json.load(f)


def haversine_km(lat1, lon1, lat2, lon2):
    """Great-circle distance between two lat/lon points, in km."""
    R = 6371.0  # Earth radius in km
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)

    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def required_speed_kmh(point_a, point_b):
    """Compute the speed a vehicle would need to travel from point_a to point_b."""
    distance_km = haversine_km(
        point_a["latitude"], point_a["longitude"],
        point_b["latitude"], point_b["longitude"],
    )

    t1 = datetime.fromisoformat(point_a["timestamp"])
    t2 = datetime.fromisoformat(point_b["timestamp"])
    elapsed_hours = abs((t2 - t1).total_seconds()) / 3600.0

    if elapsed_hours == 0:
        return distance_km, float("inf")  # instantaneous "travel" -> infinite speed, explicit not hidden

    speed_kmh = distance_km / elapsed_hours
    return distance_km, speed_kmh


def check_impossible_travel(point_a, point_b, max_speed=MAX_PLAUSIBLE_SPEED_KMH):
    """
    Deterministic physical-plausibility check.
    Returns an alert payload if required speed exceeds max_speed.
    """
    distance_km, speed_kmh = required_speed_kmh(point_a, point_b)
    is_anomaly = speed_kmh > max_speed

    return {
        "plate": point_a["plate"],
        "camera_from": point_a["camera_id"],
        "camera_to": point_b["camera_id"],
        "distance_km": round(distance_km, 2),
        "required_speed_kmh": round(speed_kmh, 2) if speed_kmh != float("inf") else "inf",
        "max_plausible_speed_kmh": max_speed,
        "anomaly": is_anomaly,
        "alert": "IMPOSSIBLE_TRAVEL" if is_anomaly else None,
    }


if __name__ == "__main__":
    normal_path = Path(__file__).parent / "fixtures" / "trajectory_fixture_normal.json"

    print("Anomaly fixture (expected: True):")
    points = load_trajectory_fixture()
    result = check_impossible_travel(points[0], points[1])
    print(result)

    print("\nNormal fixture (expected: False):")
    with open(normal_path, "r") as f:
        normal_points = json.load(f)
    result_normal = check_impossible_travel(normal_points[0], normal_points[1])
    print(result_normal)