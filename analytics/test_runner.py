from trend import counts_by_camera_and_window
from risk import build_risk_output
from anomaly import check_impossible_travel, load_trajectory_fixture
from load_fixtures import load_events
import json
from pathlib import Path

FAILURES = []


def check(label, condition):
    status = "PASS" if condition else "FAIL"
    print(f"[{status}] {label}")
    if not condition:
        FAILURES.append(label)


def test_risk():
    events = load_events()
    buckets = counts_by_camera_and_window(events)

    cam_a_output = build_risk_output("CAM_A", buckets["CAM_A"])
    check("CAM_A risk is HIGH", cam_a_output["risk"] == "HIGH")

    cam_b_output = build_risk_output("CAM_B", buckets["CAM_B"])
    check("CAM_B risk is LOW", cam_b_output["risk"] == "LOW")


def test_anomaly():
    points = load_trajectory_fixture()
    result = check_impossible_travel(points[0], points[1])
    check("Impossible-travel fixture flags anomaly=True", result["anomaly"] is True)
    check("Impossible-travel fixture sets alert=IMPOSSIBLE_TRAVEL", result["alert"] == "IMPOSSIBLE_TRAVEL")


def test_normal_trajectory():
    normal_path = Path(__file__).parent / "fixtures" / "trajectory_fixture_normal.json"
    with open(normal_path, "r") as f:
        normal_points = json.load(f)
    result = check_impossible_travel(normal_points[0], normal_points[1])
    check("Normal fixture flags anomaly=False", result["anomaly"] is False)
    check("Normal fixture sets alert=None", result["alert"] is None)


if __name__ == "__main__":
    print("Running analytics fixture tests...\n")
    test_risk()
    test_anomaly()
    test_normal_trajectory()

    print()
    if FAILURES:
        print(f"{len(FAILURES)} test(s) FAILED:")
        for f in FAILURES:
            print(f"  - {f}")
    else:
        print("All tests PASSED.")