from pydantic import BaseModel, Field
from datetime import datetime
from typing import Literal, Optional


class DetectionEvent(BaseModel):
    event_id: str = Field(..., description="Unique identifier for the detection event")
    camera_id: str = Field(..., description="Source camera ID")
    timestamp: datetime = Field(..., description="ISO 8601 formatted timestamp")
    plate: str = Field(..., description="Detected license plate text")
    plate_confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score for the plate read")
    vehicle_class: str = Field(..., description="Classification of the vehicle (e.g., car, truck)")
    latitude: float = Field(..., ge=-90.0, le=90.0, description="Camera latitude")
    longitude: float = Field(..., ge=-180.0, le=180.0, description="Camera longitude")
    track_id: int = Field(..., description="Intra-camera tracking ID")

    model_config = {
        "json_schema_extra": {
            "example": {
                "event_id": "fixture_001",
                "camera_id": "CAM_A",
                "timestamp": "2026-08-22T14:32:10",
                "plate": "KA01AB1234",
                "plate_confidence": 0.94,
                "vehicle_class": "car",
                "latitude": 12.9716,
                "longitude": 77.5946,
                "track_id": 17
            }
        }
    }


class TrajectoryPoint(BaseModel):
    camera_id: str
    timestamp: datetime
    latitude: float
    longitude: float
    confidence: float


class TrajectoryResponse(BaseModel):
    plate: str
    points: list[TrajectoryPoint]
    status: Literal["found", "not_found"]


class TrafficResponse(BaseModel):
    camera_id: Optional[str] = None
    rolling_count: int
    risk_level: Literal["LOW", "MEDIUM", "HIGH"]