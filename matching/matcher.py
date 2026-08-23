"""
Vehicle Intelligence — Candidate-Scoring Matcher
Owner: Sreenidhi (Track B)

Pipeline: DetectionEvents -> Candidate generation -> Candidate scoring
          -> MATCH/UNKNOWN -> Vehicle graph -> Trajectory

CHANGE LOG:
- score_time() and score_route() now use REAL haversine distance between
  each event's latitude/longitude instead of stubbed/flat placeholders.
- score_route() still does NOT use an actual road network — no road graph
  has been provided yet. It uses straight-line ("as the crow flies")
  distance as an optimistic proxy: real road distance is always >= this,
  so this is a stand-in, not a final answer. Swap this for real shortest-
  path road distance once the road graph / camera topology arrives.
"""

import json
import itertools
from datetime import datetime
from math import radians, sin, cos, sqrt, atan2
import networkx as nx

# ---------------------------------------------------------------------------
# CONFIG — all thresholds live here, nowhere else.
# ---------------------------------------------------------------------------

MATCH_THRESHOLD = 0.75
MAX_PLAUSIBLE_SPEED_KMH = 100   # realistic urban+highway mix ceiling
MAX_ROUTE_DISTANCE_KM = 50      # straight-line cap for the route proxy
MAX_TIME_GAP_HOURS = 6

WEIGHTS = {
    "plate": 0.5,
    "time": 0.2,
    "route": 0.2,
    "vehicle_class": 0.1,
}

# ---------------------------------------------------------------------------
# Distance helper — haversine formula (great-circle distance between two
# lat/long points, in kilometers)
# ---------------------------------------------------------------------------

def haversine_km(lat1, lon1, lat2, lon2):
    R = 6371.0  # Earth's radius in km
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    return R * c


# ---------------------------------------------------------------------------
# STEP 1 — Load fixtures
# ---------------------------------------------------------------------------

def load_events(path):
    with open(path, "r") as f:
        events = json.load(f)
    for e in events:
        e["_ts"] = datetime.fromisoformat(e["timestamp"])
    return events


# ---------------------------------------------------------------------------
# STEP 2 — Normalize plate strings
# ---------------------------------------------------------------------------

def normalize_plate(raw_plate):
    if raw_plate is None:
        return ""
    return raw_plate.upper().replace(" ", "").replace("-", "").strip()


# ---------------------------------------------------------------------------
# STEP 3 — Candidate generation
# ---------------------------------------------------------------------------

def generate_candidates(events):
    candidates = []
    for e1, e2 in itertools.combinations(events, 2):
        if e1["camera_id"] == e2["camera_id"]:
            continue
        gap_hours = abs((e2["_ts"] - e1["_ts"]).total_seconds()) / 3600
        if gap_hours > MAX_TIME_GAP_HOURS:
            continue
        candidates.append((e1, e2))
    return candidates


# ---------------------------------------------------------------------------
# STEP 4 — Scoring components
# ---------------------------------------------------------------------------

def score_plate(e1, e2):
    p1, p2 = normalize_plate(e1["plate"]), normalize_plate(e2["plate"])
    if p1 == p2 and p1 != "":
        return 1.0, f"exact plate match ({p1})"
    if not p1 or not p2:
        return 0.0, "missing plate string"
    overlap = sum(1 for a, b in zip(p1, p2) if a == b) / max(len(p1), len(p2))
    return overlap * 0.5, f"partial plate similarity ({p1} vs {p2})"


def score_time(e1, e2):
    """Real plausibility check: given the straight-line distance between
    the two camera positions and the time gap, was the required speed
    physically realistic for a vehicle?"""
    gap_hours = abs((e2["_ts"] - e1["_ts"]).total_seconds()) / 3600
    distance_km = haversine_km(e1["latitude"], e1["longitude"], e2["latitude"], e2["longitude"])

    if gap_hours <= 0:
        if distance_km <= 0.05:
            return 1.0, "identical timestamp, same location"
        return 0.0, f"impossible: {distance_km:.2f}km apart with zero time gap"

    required_speed_kmh = distance_km / gap_hours
    if required_speed_kmh > MAX_PLAUSIBLE_SPEED_KMH:
        return 0.0, (
            f"implausible: would require {required_speed_kmh:.1f} km/h "
            f"over {gap_hours:.2f}h for {distance_km:.2f}km"
        )
    plausibility = max(0.0, 1 - (required_speed_kmh / MAX_PLAUSIBLE_SPEED_KMH))
    return plausibility, (
        f"{distance_km:.2f}km in {gap_hours:.2f}h -> "
        f"{required_speed_kmh:.1f}km/h, plausible"
    )


def score_route(e1, e2):
    """Geographic proxy for route plausibility using straight-line distance.
    NOT a real road-graph check — that still needs the road graph /
    camera topology file, which hasn't arrived yet. Flag to Vithyasagar."""
    distance_km = haversine_km(e1["latitude"], e1["longitude"], e2["latitude"], e2["longitude"])
    if distance_km > MAX_ROUTE_DISTANCE_KM:
        return 0.0, f"{distance_km:.2f}km straight-line exceeds plausible route range"
    plausibility = max(0.0, 1 - (distance_km / MAX_ROUTE_DISTANCE_KM))
    return plausibility, (
        f"{distance_km:.2f}km straight-line distance "
        f"(road graph still pending — this is a proxy score)"
    )


def score_vehicle_class(e1, e2):
    c1, c2 = e1.get("vehicle_class"), e2.get("vehicle_class")
    if c1 and c2 and c1 == c2:
        return 1.0, f"vehicle class matches ({c1})"
    if not c1 or not c2:
        return 0.5, "vehicle class missing on one side"
    return 0.0, f"vehicle class mismatch ({c1} vs {c2})"


# ---------------------------------------------------------------------------
# STEP 5 — Combine into final score + MATCH/UNKNOWN decision
# ---------------------------------------------------------------------------

def score_candidate(e1, e2):
    plate_s, plate_r = score_plate(e1, e2)
    time_s, time_r = score_time(e1, e2)
    route_s, route_r = score_route(e1, e2)
    class_s, class_r = score_vehicle_class(e1, e2)

    total = (
        WEIGHTS["plate"] * plate_s
        + WEIGHTS["time"] * time_s
        + WEIGHTS["route"] * route_s
        + WEIGHTS["vehicle_class"] * class_s
    )

    return {
        "event_a": e1["event_id"],
        "event_b": e2["event_id"],
        "score": round(total, 3),
        "matched": total >= MATCH_THRESHOLD,
        "reasons": {
            "plate": plate_r,
            "time": time_r,
            "route": route_r,
            "vehicle_class": class_r,
        },
    }


# ---------------------------------------------------------------------------
# STEP 6 — Vehicle graph + trajectory
# ---------------------------------------------------------------------------

def build_graph(events, match_results):
    g = nx.DiGraph()
    event_by_id = {e["event_id"]: e for e in events}
    for e in events:
        g.add_node(e["event_id"], camera=e["camera_id"], ts=e["timestamp"])
    for m in match_results:
        if m["matched"]:
            a, b = event_by_id[m["event_a"]], event_by_id[m["event_b"]]
            first, second = (a, b) if a["_ts"] < b["_ts"] else (b, a)
            g.add_edge(first["event_id"], second["event_id"], score=m["score"])
    return g


def build_trajectories(events, graph):
    event_by_id = {e["event_id"]: e for e in events}
    trajectories = []
    seen = set()

    for node in graph.nodes:
        if node in seen or graph.in_degree(node) > 0:
            continue
        chain = [node]
        cur = node
        while list(graph.successors(cur)):
            cur = next(iter(graph.successors(cur)))
            chain.append(cur)
        if len(chain) < 2:
            continue
        seen.update(chain)
        plate = normalize_plate(event_by_id[chain[0]]["plate"])
        trajectories.append({
            "plate": plate,
            "matched": True,
            "events": [
                {
                    "event_id": eid,
                    "camera_id": event_by_id[eid]["camera_id"],
                    "timestamp": event_by_id[eid]["timestamp"],
                }
                for eid in chain
            ],
        })
    return trajectories


# ---------------------------------------------------------------------------
# RUN
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    events = load_events("fixtures.json")
    candidates = generate_candidates(events)
    results = [score_candidate(e1, e2) for e1, e2 in candidates]

    print("=== Candidate scores ===")
    for r in results:
        print(json.dumps(r, indent=2))

    graph = build_graph(events, results)
    trajectories = build_trajectories(events, graph)

    print("\n=== Trajectory JSON (output contract) ===")
    print(json.dumps(trajectories, indent=2))