/**
 * Sentinel-Traffic GIS Map Component (Leaflet + OpenStreetMap) - Sleek Interface Theme
 */

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { CameraNode, DetectionEvent, VehicleTrajectory } from '../../types';
import { calculateSpeedKmh, calculateTimeDeltaSeconds, formatTimeString } from '../../utils/geo';

interface TrafficMapProps {
  cameras: CameraNode[];
  selectedTrajectory?: VehicleTrajectory;
  lastEmittedEvent: DetectionEvent | null;
  onCameraClick?: (cameraId: string) => void;
}

export const TrafficMap: React.FC<TrafficMapProps> = ({
  cameras,
  selectedTrajectory,
  lastEmittedEvent,
  onCameraClick,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const cameraMarkersLayerRef = useRef<L.LayerGroup | null>(null);
  const trajectoryLayerRef = useRef<L.LayerGroup | null>(null);
  const vehicleMarkersLayerRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center on Bangalore Core (MG Road / Indiranagar corridor)
    const map = L.map(mapContainerRef.current, {
      center: [12.975, 77.615],
      zoom: 13,
      zoomControl: false,
      attributionControl: false,
    });

    // Dark sleek CartoDB tiles with OpenStreetMap base data
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    // Zoom control
    L.control
      .zoom({
        position: 'bottomright',
      })
      .addTo(map);

    // Attribution
    L.control
      .attribution({
        position: 'bottomleft',
        prefix: '<span class="text-xs text-slate-500 font-mono">Sentinel-Traffic GIS • OpenStreetMap</span>',
      })
      .addTo(map);

    // Layers
    const camLayer = L.layerGroup().addTo(map);
    const trajLayer = L.layerGroup().addTo(map);
    const vehLayer = L.layerGroup().addTo(map);

    cameraMarkersLayerRef.current = camLayer;
    trajectoryLayerRef.current = trajLayer;
    vehicleMarkersLayerRef.current = vehLayer;

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Camera Nodes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const camLayer = cameraMarkersLayerRef.current;
    if (!map || !camLayer) return;

    camLayer.clearLayers();

    cameras.forEach((cam) => {
      const isRecentlyActive = lastEmittedEvent?.camera_id === cam.id;

      // Custom HTML camera marker
      const iconHtml = `
        <div class="relative flex items-center justify-center cursor-pointer group" style="width: 44px; height: 44px;">
          ${
            isRecentlyActive
              ? `<div class="absolute inset-0 rounded-full bg-blue-500/40 animate-ping"></div>`
              : ''
          }
          <div class="absolute w-9 h-9 rounded-xl bg-[#0F1117] border ${
            isRecentlyActive ? 'border-blue-400 shadow-[0_0_16px_rgba(59,130,246,0.6)]' : 'border-white/20'
          } flex items-center justify-center backdrop-blur-sm transition-all duration-300 group-hover:scale-110">
            <svg class="w-4 h-4 ${
              isRecentlyActive ? 'text-blue-400' : 'text-slate-300'
            }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span class="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ${
              cam.status === 'online' ? 'bg-green-500 shadow-[0_0_6px_#22c55e]' : 'bg-red-500'
            }"></span>
          </div>
          <div class="absolute -bottom-5 px-1.5 py-0.5 rounded bg-[#0F1117] border border-white/10 text-[9px] font-mono font-bold text-slate-200 whitespace-nowrap shadow-md pointer-events-none">
            ${cam.id}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-camera-div-icon',
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });

      const marker = L.marker([cam.latitude, cam.longitude], { icon: customIcon });

      marker.bindPopup(`
        <div class="p-3 bg-[#0F1117] text-slate-100 rounded-xl border border-white/10 font-sans text-xs min-w-[210px] shadow-2xl">
          <div class="flex items-center justify-between border-b border-white/10 pb-1.5 mb-2">
            <span class="font-mono font-bold text-blue-400 text-sm">${cam.id}</span>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold ${
              cam.status === 'online' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400'
            }">${cam.status.toUpperCase()}</span>
          </div>
          <p class="font-semibold text-slate-100 text-xs mb-0.5">${cam.name}</p>
          <p class="text-slate-400 text-[11px] mb-2.5">${cam.locationName}</p>
          <div class="grid grid-cols-2 gap-1.5 text-[10px] font-mono bg-black/30 p-2 rounded-lg border border-white/5">
            <div>
              <span class="text-slate-500 block">Detections:</span>
              <span class="text-slate-100 font-bold text-xs">${cam.detectionCount}</span>
            </div>
            <div>
              <span class="text-slate-500 block">Zone:</span>
              <span class="text-slate-300">${cam.zone.split('-')[0]}</span>
            </div>
          </div>
          ${
            cam.lastDetectionTime
              ? `<div class="mt-2 text-[10px] text-slate-400 font-mono">Last active: <span class="text-blue-400">${formatTimeString(
                  cam.lastDetectionTime
                )}</span></div>`
              : ''
          }
        </div>
      `, {
        className: 'custom-tactical-popup',
      });

      marker.on('click', () => {
        if (onCameraClick) onCameraClick(cam.id);
      });

      camLayer.addLayer(marker);
    });
  }, [cameras, lastEmittedEvent, onCameraClick]);

  // Update Trajectory & Vehicle Positions
  useEffect(() => {
    const map = mapInstanceRef.current;
    const trajLayer = trajectoryLayerRef.current;
    const vehLayer = vehicleMarkersLayerRef.current;
    if (!map || !trajLayer || !vehLayer) return;

    trajLayer.clearLayers();
    vehLayer.clearLayers();

    if (!selectedTrajectory || selectedTrajectory.detections.length === 0) return;

    const detections = selectedTrajectory.detections;
    const isAnomaly = selectedTrajectory.hasImpossibleTravel;
    const pathColor = isAnomaly ? '#ef4444' : '#3b82f6'; // Red for impossible travel anomaly, Blue for normal

    const latLngs: [number, number][] = detections.map((d) => [d.latitude, d.longitude]);

    // 1. Trajectory Polyline connecting Camera A -> Camera B
    if (latLngs.length >= 2) {
      // Glow underlayer
      const glowLine = L.polyline(latLngs, {
        color: pathColor,
        weight: 8,
        opacity: 0.3,
        lineCap: 'round',
        lineJoin: 'round',
      });
      trajLayer.addLayer(glowLine);

      // Main dashed animated polyline
      const mainLine = L.polyline(latLngs, {
        color: pathColor,
        weight: 3.5,
        opacity: 0.95,
        dashArray: '8, 8',
        className: 'trajectory-polyline',
      });
      trajLayer.addLayer(mainLine);

      // Mid-point speed / anomaly badge
      for (let i = 0; i < detections.length - 1; i++) {
        const d1 = detections[i];
        const d2 = detections[i + 1];
        const midLat = (d1.latitude + d2.latitude) / 2;
        const midLng = (d1.longitude + d2.longitude) / 2;
        const deltaSec = calculateTimeDeltaSeconds(d1.timestamp, d2.timestamp);
        const segmentSpeed = calculateSpeedKmh(
          selectedTrajectory.totalDistanceKm,
          deltaSec
        );

        const badgeHtml = `
          <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${
            isAnomaly
              ? 'bg-red-950/95 border-red-500 text-red-100 shadow-[0_0_14px_rgba(239,68,68,0.5)]'
              : 'bg-[#0F1117]/95 border-blue-500 text-blue-100 shadow-[0_0_14px_rgba(59,130,246,0.4)]'
          } border text-[11px] font-mono font-bold shadow-lg pointer-events-none whitespace-nowrap -translate-x-1/2 -translate-y-1/2">
            ${isAnomaly ? '🚨' : '⚡'} 
            <span>${d1.camera_id} ➔ ${d2.camera_id}</span>
            <span class="opacity-30">|</span>
            <span>${deltaSec}s</span>
            <span class="opacity-30">|</span>
            <span class="${isAnomaly ? 'text-red-300 font-extrabold' : 'text-blue-300'}">${segmentSpeed} km/h</span>
          </div>
        `;

        const midMarker = L.marker([midLat, midLng], {
          icon: L.divIcon({
            html: badgeHtml,
            className: 'trajectory-badge-icon',
            iconSize: [0, 0],
          }),
        });
        trajLayer.addLayer(midMarker);
      }

      // Auto-fit bounds with padding
      try {
        const bounds = L.latLngBounds(latLngs);
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15, animate: true });
      } catch (err) {
        console.error('FitBounds error:', err);
      }
    } else if (latLngs.length === 1) {
      map.setView(latLngs[0], 14, { animate: true });
    }

    // 2. Render Vehicle Sighting Markers
    detections.forEach((d, idx) => {
      const isLatest = idx === detections.length - 1;
      const vehicleHtml = `
        <div class="relative flex flex-col items-center cursor-pointer group" style="width: 140px; transform: translate(-50%, -50%);">
          ${
            isLatest
              ? `<div class="absolute w-12 h-12 rounded-full ${
                  isAnomaly ? 'bg-red-500/40' : 'bg-blue-500/40'
                } animate-ping" style="top: -6px;"></div>`
              : ''
          }
          <!-- Vehicle marker pin -->
          <div class="relative z-10 w-9 h-9 rounded-xl ${
            isAnomaly ? 'bg-red-600 border-red-300' : 'bg-blue-600 border-blue-200'
          } border-2 flex items-center justify-center shadow-lg text-white font-bold">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h8m-8 4h8m-4 4h4M5 7a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H7a2 2 0 01-2-2V7z" />
            </svg>
            <span class="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#0F1117] border border-white/20 text-[9px] font-mono flex items-center justify-center text-slate-200 font-bold">
              ${idx + 1}
            </span>
          </div>

          <!-- Plate tag badge -->
          <div class="mt-1.5 px-2.5 py-0.5 rounded-lg bg-[#0F1117]/95 border ${
            isAnomaly ? 'border-red-500/80 text-red-300' : 'border-blue-500/80 text-blue-300'
          } text-[10px] font-mono font-bold shadow-md tracking-wider flex items-center gap-1.5 whitespace-nowrap">
            <span class="w-1.5 h-1.5 rounded-full ${isAnomaly ? 'bg-red-400' : 'bg-blue-400'}"></span>
            ${d.plate}
            <span class="text-[9px] text-slate-400">@ ${d.camera_id}</span>
          </div>
        </div>
      `;

      const vehIcon = L.divIcon({
        html: vehicleHtml,
        className: 'custom-vehicle-div-icon',
        iconSize: [0, 0],
      });

      const marker = L.marker([d.latitude, d.longitude], { icon: vehIcon, zIndexOffset: 500 });

      marker.bindPopup(`
        <div class="p-3 bg-[#0F1117] text-slate-100 rounded-xl border border-white/10 font-sans text-xs min-w-[220px] shadow-2xl">
          <div class="flex items-center justify-between border-b border-white/10 pb-1.5 mb-2">
            <div class="font-mono font-bold text-amber-300 text-sm tracking-wider">${d.plate}</div>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/10 text-slate-200">Point #${idx + 1}</span>
          </div>
          <div class="space-y-1.5 text-xs font-mono">
            <div class="flex justify-between text-slate-300">
              <span class="text-slate-500">Camera:</span>
              <span class="font-bold text-blue-400">${d.camera_id}</span>
            </div>
            <div class="flex justify-between text-slate-300">
              <span class="text-slate-500">Confidence:</span>
              <span class="font-bold text-green-400">${(d.plate_confidence * 100).toFixed(0)}%</span>
            </div>
            <div class="flex justify-between text-slate-300">
              <span class="text-slate-500">Class:</span>
              <span class="capitalize text-slate-200">${d.vehicle_class}</span>
            </div>
            <div class="flex justify-between text-slate-300">
              <span class="text-slate-500">Timestamp:</span>
              <span class="text-slate-200">${formatTimeString(d.timestamp)}</span>
            </div>
            <div class="flex justify-between text-slate-300">
              <span class="text-slate-500">Track ID:</span>
              <span class="text-slate-200">#${d.track_id}</span>
            </div>
            <div class="flex justify-between text-slate-300">
              <span class="text-slate-500">Coordinates:</span>
              <span class="text-[10px] text-slate-400">${d.latitude.toFixed(4)}, ${d.longitude.toFixed(4)}</span>
            </div>
          </div>
        </div>
      `);

      vehLayer.addLayer(marker);
    });
  }, [selectedTrajectory]);

  return (
    <div className="relative w-full h-full min-h-[420px] rounded-2xl overflow-hidden border border-white/10 bg-[#14161F] shadow-2xl">
      {/* Map Target Div */}
      <div id="gis-map-container" ref={mapContainerRef} className="w-full h-full absolute inset-0 z-0" />

      {/* Compass Overlay / Map Watermark */}
      <div className="absolute top-3 left-3 z-10 pointer-events-none flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#0F1117]/90 backdrop-blur-md border border-white/10 text-xs font-mono text-slate-300 shadow-md">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
        <span className="font-semibold text-slate-200">GIS LIVE FEED</span>
        <span className="text-white/20">|</span>
        <span className="text-blue-400">Bangalore Urban Grid</span>
      </div>

      {/* Trajectory status overlay on top-right of map */}
      {selectedTrajectory && (
        <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-1 pointer-events-none">
          <div
            className={`px-3.5 py-2 rounded-xl backdrop-blur-md border text-xs font-mono font-bold shadow-lg flex items-center gap-2 ${
              selectedTrajectory.hasImpossibleTravel
                ? 'bg-red-950/90 border-red-500/80 text-red-200'
                : selectedTrajectory.detections.length >= 2
                ? 'bg-[#0F1117]/90 border-blue-500/80 text-blue-200'
                : 'bg-[#0F1117]/90 border-white/10 text-slate-300'
            }`}
          >
            {selectedTrajectory.hasImpossibleTravel ? (
              <>
                <span className="text-red-400">🚨 ANOMALY:</span>
                <span>IMPOSSIBLE TRAVEL</span>
              </>
            ) : selectedTrajectory.detections.length >= 2 ? (
              <>
                <span className="text-blue-400">✓ MATCHED:</span>
                <span>{selectedTrajectory.detections.length} NODES LINKED</span>
              </>
            ) : (
              <>
                <span className="text-slate-400">● DETECTED:</span>
                <span>SINGLE SIGHTING</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
