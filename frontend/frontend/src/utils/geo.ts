/**
 * GIS and Anomaly Computation Utilities
 */

import { DetectionEvent, ImpossibleTravelDetails, RiskLevel } from '../types';

/**
 * Computes great-circle distance between two points in Kilometers using the Haversine formula
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Calculates duration in seconds between two ISO timestamp strings
 */
export function calculateTimeDeltaSeconds(timestamp1: string, timestamp2: string): number {
  const t1 = new Date(timestamp1).getTime();
  const t2 = new Date(timestamp2).getTime();
  const diffSec = Math.abs((t2 - t1) / 1000);
  return Math.max(diffSec, 1); // Avoid division by zero
}

/**
 * Calculates speed in km/h given distance in km and duration in seconds
 */
export function calculateSpeedKmh(distanceKm: number, durationSeconds: number): number {
  if (durationSeconds <= 0) return 0;
  const hours = durationSeconds / 3600;
  return Number((distanceKm / hours).toFixed(1));
}

/**
 * Evaluates impossible travel anomaly between two detection events
 * Max realistic urban speed threshold is typically 120 km/h in dense metropolitan corridors.
 * If implied speed is > 130 km/h, it is flagged as IMPOSSIBLE TRAVEL (e.g. cloned plate, teleportation anomaly).
 */
export function evaluateImpossibleTravel(
  eventA: DetectionEvent,
  eventB: DetectionEvent,
  thresholdKmh: number = 130
): { isImpossible: boolean; details?: ImpossibleTravelDetails } {
  // If same camera, not a cross-camera travel anomaly
  if (eventA.camera_id === eventB.camera_id) {
    return { isImpossible: false };
  }

  const distanceKm = calculateHaversineDistanceKm(
    eventA.latitude,
    eventA.longitude,
    eventB.latitude,
    eventB.longitude
  );

  const durationSeconds = calculateTimeDeltaSeconds(eventA.timestamp, eventB.timestamp);
  const computedSpeedKmh = calculateSpeedKmh(distanceKm, durationSeconds);

  const isImpossible = computedSpeedKmh > thresholdKmh;

  if (isImpossible) {
    return {
      isImpossible: true,
      details: {
        distanceKm,
        durationSeconds,
        computedSpeedKmh,
        thresholdSpeedKmh: thresholdKmh,
        originCamera: eventA.camera_id,
        destinationCamera: eventB.camera_id,
        originTime: eventA.timestamp,
        destinationTime: eventB.timestamp,
      },
    };
  }

  return { isImpossible: false };
}

/**
 * Derives traffic risk level based on vehicle speed, congestion and anomaly status
 */
export function evaluateTrafficRisk(
  hasImpossibleTravel: boolean,
  speedKmh: number,
  detectionsCount: number
): RiskLevel {
  if (hasImpossibleTravel || speedKmh > 120) {
    return 'HIGH';
  }
  if (speedKmh > 80 || detectionsCount >= 3) {
    return 'MEDIUM';
  }
  return 'LOW';
}

/**
 * Formats time string to user-friendly HH:MM:SS format
 */
export function formatTimeString(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString.split('T')[1] || isoString;
    return date.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return isoString;
  }
}
