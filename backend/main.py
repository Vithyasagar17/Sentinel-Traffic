from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from typing import List
import logging

from models import DetectionEvent, TrajectoryResponse, TrajectoryPoint, TrafficResponse

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("sentinel-backend")

app = FastAPI(title="Sentinel-Traffic Backend", version="0.1.0")

# ---- IN-MEMORY STORE (Phase 1 — swap for SQLite later if needed) ----
events_store: List[DetectionEvent] = []


@app.get("/health")
def health():
    return {"status": "ok", "events_stored": len(events_store)}


@app.post("/events", response_model=DetectionEvent)
def create_event(event: DetectionEvent):
    """
    Accepts a DetectionEvent — works identically for fixture events (F)
    and real Vision events (A). No downstream rewrite needed.
    """
    events_store.append(event)
    logger.info(f"Event ingested: {event.event_id} | plate={event.plate} | cam={event.camera_id}")
    return event


@app.get("/events", response_model=List[DetectionEvent])
def get_events():
    return events_store


@app.get("/trajectory/{plate}", response_model=TrajectoryResponse)
def get_trajectory(plate: str):
    """
    Returns all observations for a given plate, ordered by time.
    NOTE: actual cross-camera MATCH scoring is owned by Track B (Sreenidhi).
    This endpoint currently returns raw same-plate observations from the store;
    B's matcher output can be wired in here once ready.
    """
    matches = [e for e in events_store if e.plate.upper() == plate.upper()]
    if not matches:
        return TrajectoryResponse(plate=plate, points=[], status="not_found")

    matches.sort(key=lambda e: e.timestamp)
    points = [
        TrajectoryPoint(
            camera_id=e.camera_id,
            timestamp=e.timestamp,
            latitude=e.latitude,
            longitude=e.longitude,
            confidence=e.plate_confidence,
        )
        for e in matches
    ]
    return TrajectoryResponse(plate=plate, points=points, status="found")


@app.get("/traffic", response_model=TrafficResponse)
def get_traffic(camera_id: str | None = None):
    """
    Basic rolling count -> risk badge.
    NOTE: full trend logic is owned by Track C (Jamuna); this is a stable
    placeholder so E (frontend) has something real to render against from H3.
    """
    relevant = events_store if camera_id is None else [e for e in events_store if e.camera_id == camera_id]
    count = len(relevant)

    if count < 5:
        risk = "LOW"
    elif count < 15:
        risk = "MEDIUM"
    else:
        risk = "HIGH"

    return TrafficResponse(camera_id=camera_id, rolling_count=count, risk_level=risk)


@app.exception_handler(Exception)
async def generic_exception_handler(request, exc):
    logger.error(f"Unhandled error: {exc}")
    return JSONResponse(status_code=500, content={"detail": "Internal server error", "error": str(exc)})