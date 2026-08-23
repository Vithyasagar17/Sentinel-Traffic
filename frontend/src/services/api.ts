/**
 * Sentinel-Traffic API & Data Service Layer
 * 
 * Clean separation between:
 * fixture data -> API data -> UI components
 * 
 * Switch USE_FIXTURES to false to consume the real FastAPI backend.
 */

import { CameraNode, DetectionEvent, RiskLevel, TrafficAlert, VehicleTrajectory } from '../types';
import { INITIAL_CAMERAS, PRIMARY_DEMO_EVENTS } from '../data/fixtures';
import { calculateHaversineDistanceKm, calculateSpeedKmh, calculateTimeDeltaSeconds, evaluateImpossibleTravel, evaluateTrafficRisk } from '../utils/geo';

// Master configuration switch for Hackathon Fixtures vs Live FastAPI Backend
export let USE_FIXTURES = true;
export let API_BASE_URL = 'http://localhost:8000/api';

export function setUseFixtures(useFixtures: boolean) {
  USE_FIXTURES = useFixtures;
}

export function setApiBaseUrl(url: string) {
  API_BASE_URL = url;
}

// In-memory simulation state for fixture mode
class MockBackendState {
  cameras: CameraNode[] = JSON.parse(JSON.stringify(INITIAL_CAMERAS));
  events: DetectionEvent[] = [];
  alerts: TrafficAlert[] = [];

  reset() {
    this.cameras = JSON.parse(JSON.stringify(INITIAL_CAMERAS));
    this.events = [];
    this.alerts = [];
  }

  addEvent(event: DetectionEvent): { trajectory: VehicleTrajectory; alert?: TrafficAlert } {
    this.events.push(event);

    // Update camera stats
    const cam = this.cameras.find((c) => c.id === event.camera_id);
    if (cam) {
      cam.detectionCount += 1;
      cam.lastDetectionTime = event.timestamp;
    }

    // Recalculate trajectory for this plate
    const vehicleEvents = this.events
      .filter((e) => e.plate === event.plate)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    let totalDist = 0;
    let timeDelta = 0;
    let speed = 0;
    let hasAnomaly = false;
    let anomalyDetails;

    if (vehicleEvents.length >= 2) {
      const first = vehicleEvents[0];
      const last = vehicleEvents[vehicleEvents.length - 1];

      totalDist = calculateHaversineDistanceKm(
        first.latitude,
        first.longitude,
        last.latitude,
        last.longitude
      );
      timeDelta = calculateTimeDeltaSeconds(first.timestamp, last.timestamp);
      speed = calculateSpeedKmh(totalDist, timeDelta);

      // Check impossible travel across consecutive camera hops
      for (let i = 0; i < vehicleEvents.length - 1; i++) {
        const check = evaluateImpossibleTravel(vehicleEvents[i], vehicleEvents[i + 1]);
        if (check.isImpossible && check.details) {
          hasAnomaly = true;
          anomalyDetails = check.details;

          // Generate alert
          const alertId = `alert_${event.plate}_${Date.now()}`;
          const existing = this.alerts.find((a) => a.plate === event.plate && a.type === 'IMPOSSIBLE_TRAVEL');
          if (!existing) {
            const newAlert: TrafficAlert = {
              id: alertId,
              type: 'IMPOSSIBLE_TRAVEL',
              severity: 'CRITICAL',
              title: 'IMPOSSIBLE TRAVEL DETECTED',
              message: `Vehicle ${event.plate} moved from ${check.details.originCamera} to ${check.details.destinationCamera} (${check.details.distanceKm} km in ${check.details.durationSeconds}s) at ${check.details.computedSpeedKmh} km/h, exceeding realistic urban corridor limits.`,
              plate: event.plate,
              timestamp: event.timestamp,
              camerasInvolved: [check.details.originCamera, check.details.destinationCamera],
              metrics: {
                distanceKm: check.details.distanceKm,
                durationSec: check.details.durationSeconds,
                computedSpeedKmh: check.details.computedSpeedKmh,
              },
            };
            this.alerts.unshift(newAlert);
          }
          break;
        }
      }
    }

    const riskLevel: RiskLevel = evaluateTrafficRisk(hasAnomaly, speed, vehicleEvents.length);

    const trajectory: VehicleTrajectory = {
      plate: event.plate,
      vehicle_class: event.vehicle_class,
      detections: vehicleEvents,
      totalDistanceKm: totalDist,
      timeDeltaSeconds: timeDelta,
      calculatedSpeedKmh: speed,
      riskLevel,
      hasImpossibleTravel: hasAnomaly,
      impossibleTravelDetails: anomalyDetails,
      lastSeenCamera: event.camera_id,
      lastSeenTime: event.timestamp,
      matchStatus: vehicleEvents.length > 1 ? (hasAnomaly ? 'ANOMALY' : 'MATCHED') : 'DETECTED',
    };

    const latestAlert = this.alerts.find((a) => a.plate === event.plate);

    return { trajectory, alert: latestAlert };
  }
}

export const mockBackend = new MockBackendState();

/**
 * Fetch all registered cameras and their live operational status
 */
export async function getCameras(): Promise<CameraNode[]> {
  if (USE_FIXTURES) {
    return Promise.resolve([...mockBackend.cameras]);
  }
  try {
    const res = await fetch(`${API_BASE_URL}/cameras`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[Sentinel-API] Real backend unavailable, falling back to fixtures:', err);
    return [...mockBackend.cameras];
  }
}

/**
 * Fetch recent detection events
 */
export async function getEvents(limit: number = 20): Promise<DetectionEvent[]> {
  if (USE_FIXTURES) {
    return Promise.resolve([...mockBackend.events].slice(-limit).reverse());
  }
  try {
    const res = await fetch(`${API_BASE_URL}/events?limit=${limit}`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[Sentinel-API] Fallback to fixture events:', err);
    return [...mockBackend.events].slice(-limit).reverse();
  }
}

/**
 * Fetch vehicle trajectory and match history by license plate
 */
export async function getTrajectory(plate: string): Promise<VehicleTrajectory | null> {
  if (USE_FIXTURES) {
    const events = mockBackend.events.filter((e) => e.plate === plate);
    if (events.length === 0) return null;
    const lastEvent = events[events.length - 1];
    return mockBackend.addEvent(lastEvent).trajectory;
  }
  try {
    const res = await fetch(`${API_BASE_URL}/trajectories/${encodeURIComponent(plate)}`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[Sentinel-API] Failed to get trajectory for ${plate}:`, err);
    return null;
  }
}

/**
 * Fetch active anomaly alerts
 */
export async function getAlerts(): Promise<TrafficAlert[]> {
  if (USE_FIXTURES) {
    return Promise.resolve([...mockBackend.alerts]);
  }
  try {
    const res = await fetch(`${API_BASE_URL}/alerts`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[Sentinel-API] Failed to get alerts from backend:', err);
    return [...mockBackend.alerts];
  }
}

/**
 * Post a new detection event (used during simulations or upstream camera ingest)
 */
export async function postDetectionEvent(event: DetectionEvent): Promise<{
  success: boolean;
  trajectory: VehicleTrajectory;
  alert?: TrafficAlert;
}> {
  if (USE_FIXTURES) {
    const result = mockBackend.addEvent(event);
    return Promise.resolve({
      success: true,
      trajectory: result.trajectory,
      alert: result.alert,
    });
  }
  try {
    const res = await fetch(`${API_BASE_URL}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('[Sentinel-API] Failed to post event to real backend, processing locally:', err);
    const result = mockBackend.addEvent(event);
    return {
      success: true,
      trajectory: result.trajectory,
      alert: result.alert,
    };
  }
}

/**
 * Reset all demo simulation data
 */
export function resetSimulationData() {
  mockBackend.reset();
}
