from collections import Counter
from load_fixtures import load_events


def count_by_camera(events):
    """Count how many detection events occurred per camera_id."""
    counts = Counter(e["camera_id"] for e in events)
    return dict(counts)


if __name__ == "__main__":
    events = load_events()
    counts = count_by_camera(events)
    print("Vehicle counts by camera:")
    for camera_id, count in counts.items():
        print(f"  {camera_id}: {count}")