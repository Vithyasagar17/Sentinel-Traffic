/**
 * SIH Sentinel-Traffic - Frozen Contract & Type Definitions
 */

export interface DetectionEvent {
  event_id: string;
  camera_id: string;
  timestamp: string; // e.g. "2026-08-22T14:32:10"
  plate: string;
  plate_confidence: number;
  vehicle_class: string;
  latitude: number;
  longitude: number;
  track_id: number;
}

export interface CameraNode {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  status: 'online' | 'offline' | 'warning';
  lastDetectionTime?: string;
  detectionCount: number;
  locationName: string;
  zone: string;
}

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface ImpossibleTravelDetails {
  distanceKm: number;
  durationSeconds: number;
  computedSpeedKmh: number;
  thresholdSpeedKmh: number;
  originCamera: string;
  destinationCamera: string;
  originTime: string;
  destinationTime: string;
}

export interface VehicleTrajectory {
  plate: string;
  vehicle_class: string;
  detections: DetectionEvent[];
  totalDistanceKm: number;
  timeDeltaSeconds: number;
  calculatedSpeedKmh: number;
  riskLevel: RiskLevel;
  hasImpossibleTravel: boolean;
  impossibleTravelDetails?: ImpossibleTravelDetails;
  lastSeenCamera: string;
  lastSeenTime: string;
  matchStatus: 'DETECTED' | 'MATCHED' | 'ANOMALY';
}

export interface TrafficAlert {
  id: string;
  type: 'IMPOSSIBLE_TRAVEL' | 'HIGH_SPEED_CORRIDOR' | 'CLONED_PLATE_SUSPECT' | 'CONGESTION_RISK';
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  message: string;
  plate: string;
  timestamp: string;
  camerasInvolved: string[];
  metrics?: {
    distanceKm: number;
    durationSec: number;
    computedSpeedKmh: number;
  };
}

export interface SystemStats {
  totalCamerasOnline: number;
  totalCameras: number;
  activeVehiclesTracked: number;
  anomaliesDetected: number;
  overallTrafficRisk: RiskLevel;
}
