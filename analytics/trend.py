from collections import defaultdict
from datetime import datetime
from load_fixtures import load_events

WINDOW_MINUTES = 2  # configurable — size of each rolling bucket


def bucket_timestamp(timestamp_str, window_minutes=WINDOW_MINUTES):
    """Round a timestamp down to the start of its window bucket."""
    dt = datetime.fromisoformat(timestamp_str)
    bucket_minute = (dt.minute // window_minutes) * window_minutes
    return dt.replace(minute=bucket_minute, second=0, microsecond=0)


def counts_by_camera_and_window(events, window_minutes=WINDOW_MINUTES):
    """Return {camera_id: {window_start: count}}."""
    buckets = defaultdict(lambda: defaultdict(int))
    for e in events:
        window_start = bucket_timestamp(e["timestamp"], window_minutes)
        buckets[e["camera_id"]][window_start] += 1
    return buckets


def compute_trend(camera_windows):
    """
    Given a dict of {window_start: count} for one camera, sorted by time,
    return the trend of the LAST window vs the one before it.
    trend = (current - previous) / previous   (0.0 if no previous data)
    """
    sorted_windows = sorted(camera_windows.items())
    if len(sorted_windows) < 2:
        return 0.0  # not enough data yet — deterministic default, no guessing

    previous_count = sorted_windows[-2][1]
    current_count = sorted_windows[-1][1]

    if previous_count == 0:
        return 0.0  # avoid divide-by-zero; explicit, not hidden

    trend = (current_count - previous_count) / previous_count
    return round(trend, 2)


if __name__ == "__main__":
    events = load_events()
    buckets = counts_by_camera_and_window(events)

    for camera_id, windows in buckets.items():
        print(f"\n{camera_id}:")
        for window_start, count in sorted(windows.items()):
            print(f"  window {window_start.time()} -> count {count}")
        trend = compute_trend(windows)
        print(f"  trend (last window vs previous) = {trend}")