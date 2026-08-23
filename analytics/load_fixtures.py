import json
from pathlib import Path

FIXTURE_PATH = Path(__file__).parent.parent / "fixtures" / "events.json"

def load_events():
    with open(FIXTURE_PATH, "r", encoding="utf-8-sig") as f:
        events = json.load(f)
    return events

if __name__ == "__main__":
    events = load_events()
    print(f"Loaded {len(events)} events")
    for e in events:
        print(e)