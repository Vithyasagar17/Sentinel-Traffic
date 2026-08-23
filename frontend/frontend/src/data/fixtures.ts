/**
 * SIH Sentinel-Traffic Fixtures
 * 
 * Frozen DetectionEvent Contract format:
 * {
 *   "event_id": "fixture_001",
 *   "camera_id": "CAM_A",
 *   "timestamp": "2026-08-22T14:32:10",
 *   "plate": "KA01AB1234",
 *   "plate_confidence": 0.94,
 *   "vehicle_class": "car",
 *   "latitude": 12.9716,
 *   "longitude": 77.5946,
 *   "track_id": 17
 * }
 */

import { CameraNode, DetectionEvent } from '../types';

export const INITIAL_CAMERAS: CameraNode[] = [
  {
    id: 'CAM_A',
    name: 'MG Road Trinity Junction',
    latitude: 12.9716,
    longitude: 77.5946,
    status: 'online',
    locationName: 'MG Road / Trinity Circle, Bangalore',
    zone: 'Zone 1 - Central CBD',
    detectionCount: 142,
    lastDetectionTime: '2026-08-22T14:32:10',
  },
  {
    id: 'CAM_B',
    name: 'Indiranagar 100ft Rd North',
    latitude: 12.9784,
    longitude: 77.6408,
    status: 'online',
    locationName: '100ft Road Indiranagar, Bangalore',
    zone: 'Zone 2 - East Corridor',
    detectionCount: 98,
    lastDetectionTime: '2026-08-22T14:33:20',
  },
  {
    id: 'CAM_C',
    name: 'Koramangala Sony World Signal',
    latitude: 12.9352,
    longitude: 77.6245,
    status: 'online',
    locationName: 'Sony World Junction, Koramangala',
    zone: 'Zone 3 - South Corridor',
    detectionCount: 115,
    lastDetectionTime: '2026-08-22T14:28:45',
  },
  {
    id: 'CAM_D',
    name: 'Hebbal Flyover North Toll',
    latitude: 13.0358,
    longitude: 77.5970,
    status: 'online',
    locationName: 'Airport Expressway Entry, Hebbal',
    zone: 'Zone 4 - North Highway',
    detectionCount: 84,
    lastDetectionTime: '2026-08-22T14:15:30',
  },
];

/**
 * Primary Hackathon Test Flow (Steps 1 through 10)
 * Step 1: Detect KA01AB1234 at CAM_A
 * Step 2: Detect KA01AB1234 at CAM_B (70s later, 5.2km away -> 267 km/h)
 * Step 3: Match KA01AB1234 across CAM_A and CAM_B -> Auto Trajectory + HIGH Risk + Impossible Travel Alert
 */
export const PRIMARY_DEMO_EVENTS: DetectionEvent[] = [
  {
    event_id: 'fixture_001',
    camera_id: 'CAM_A',
    timestamp: '2026-08-22T14:32:10',
    plate: 'KA01AB1234',
    plate_confidence: 0.94,
    vehicle_class: 'car',
    latitude: 12.9716,
    longitude: 77.5946,
    track_id: 17,
  },
  {
    event_id: 'fixture_002',
    camera_id: 'CAM_B',
    timestamp: '2026-08-22T14:33:20', // 70 seconds later, 5.2km distance -> impossible speed
    plate: 'KA01AB1234',
    plate_confidence: 0.96,
    vehicle_class: 'car',
    latitude: 12.9784,
    longitude: 77.6408,
    track_id: 29,
  },
];

/**
 * Extended demo scenario including multi-hop corridor (CAM_A -> CAM_B -> CAM_C)
 */
export const MULTI_HOP_DEMO_EVENTS: DetectionEvent[] = [
  {
    event_id: 'fixture_001',
    camera_id: 'CAM_A',
    timestamp: '2026-08-22T14:32:10',
    plate: 'KA01AB1234',
    plate_confidence: 0.94,
    vehicle_class: 'car',
    latitude: 12.9716,
    longitude: 77.5946,
    track_id: 17,
  },
  {
    event_id: 'fixture_002',
    camera_id: 'CAM_B',
    timestamp: '2026-08-22T14:33:20',
    plate: 'KA01AB1234',
    plate_confidence: 0.96,
    vehicle_class: 'car',
    latitude: 12.9784,
    longitude: 77.6408,
    track_id: 29,
  },
  {
    event_id: 'fixture_003',
    camera_id: 'CAM_C',
    timestamp: '2026-08-22T14:39:15',
    plate: 'KA01AB1234',
    plate_confidence: 0.92,
    vehicle_class: 'car',
    latitude: 12.9352,
    longitude: 77.6245,
    track_id: 41,
  },
];

/**
 * Normal urban commuter scenario for comparison (Low Risk, Normal Travel Time)
 */
export const NORMAL_COMMUTER_EVENTS: DetectionEvent[] = [
  {
    event_id: 'fixture_norm_01',
    camera_id: 'CAM_A',
    timestamp: '2026-08-22T14:10:00',
    plate: 'KA05MH8844',
    plate_confidence: 0.98,
    vehicle_class: 'suv',
    latitude: 12.9716,
    longitude: 77.5946,
    track_id: 5,
  },
  {
    event_id: 'fixture_norm_02',
    camera_id: 'CAM_B',
    timestamp: '2026-08-22T14:24:30', // ~14.5 minutes for 5.2 km -> ~21.5 km/h (typical Bangalore traffic)
    plate: 'KA05MH8844',
    plate_confidence: 0.95,
    vehicle_class: 'suv',
    latitude: 12.9784,
    longitude: 77.6408,
    track_id: 12,
  },
];

/**
 * Ambient city background detection events to simulate busy live camera streams
 */
export const AMBIENT_BACKGROUND_EVENTS: DetectionEvent[] = [
  {
    event_id: 'ambient_001',
    camera_id: 'CAM_C',
    timestamp: '2026-08-22T14:31:05',
    plate: 'KA03EJ4499',
    plate_confidence: 0.91,
    vehicle_class: 'truck',
    latitude: 12.9352,
    longitude: 77.6245,
    track_id: 55,
  },
  {
    event_id: 'ambient_002',
    camera_id: 'CAM_D',
    timestamp: '2026-08-22T14:31:40',
    plate: 'DL04CA1102',
    plate_confidence: 0.89,
    vehicle_class: 'bus',
    latitude: 13.0358,
    longitude: 77.5970,
    track_id: 88,
  },
  {
    event_id: 'ambient_003',
    camera_id: 'CAM_A',
    timestamp: '2026-08-22T14:32:45',
    plate: 'MH12RN7733',
    plate_confidence: 0.95,
    vehicle_class: 'car',
    latitude: 12.9716,
    longitude: 77.5946,
    track_id: 92,
  },
];
