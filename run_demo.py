import sys
import json
import requests
from pathlib import Path

# Add matching folder to path so we can import Sreenidhi's matcher directly
matching_dir = Path(__file__).resolve().parent / "matching"
sys.path.append(str(matching_dir))

from matcher import load_events, generate_candidates, score_candidate, build_graph, build_trajectories

BACKEND_URL = "http://127.0.0.1:8000"
FIXTURES_PATH = Path(__file__).resolve().parent / "fixtures" / "fixtures.json"

def run_integration_demo():
    print("=" * 60)
    print("🚀 SENTINEL-TRAFFIC: END-TO-END INTEGRATION DEMO")
    print("=" * 60)

    # 1. Check Backend Health
    print("\n[1/3] Checking FastAPI Backend Health...")
    try:
        health_res = requests.get(f"{BACKEND_URL}/health")
        if health_res.status_code == 200:
            print(f"✅ Backend is ONLINE: {health_res.json()}")
        else:
            print(f"❌ Backend responded with status {health_res.status_code}")
            return
    except requests.exceptions.ConnectionError:
        print("❌ CRITICAL: Could not connect to backend! Make sure Uvicorn is running on port 8000.")
        print("   Run: cd backend && uvicorn main:app --reload")
        return

    # 2. Seed Backend with Fixtures
    print("\n[2/3] Seeding Backend with Fixture Events...")
    with open(FIXTURES_PATH, "r") as f:
        fixtures = json.load(f)

    success_count = 0
    for event in fixtures:
        res = requests.post(f"{BACKEND_URL}/events", json=event)
        if res.status_code == 200:
            success_count += 1
        else:
            print(f"   ⚠️ Failed to ingest {event['event_id']}: {res.text}")

    print(f"✅ Successfully seeded {success_count}/{len(fixtures)} events into Ashwitha's backend.")

    # 3. Run Sreenidhi's Matcher Pipeline
    print("\n[3/3] Executing Sreenidhi's Matcher & Building Trajectories...")
    events = load_events(str(FIXTURES_PATH))
    candidates = generate_candidates(events)
    results = [score_candidate(e1, e2) for e1, e2 in candidates]
    
    graph = build_graph(events, results)
    trajectories = build_trajectories(events, graph)

    print(f"✅ Generated {len(trajectories)} valid vehicle trajectories.")
    print("\n--- FINAL TRAJECTORY OUTPUT CONTRACT ---")
    print(json.dumps(trajectories, indent=2))
    print("=" * 60)
    print("🎉 DEMO PIPELINE COMPLETED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == "__main__":
    run_integration_demo()