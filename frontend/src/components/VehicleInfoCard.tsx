/**
 * Vehicle Information Component - Sleek Interface Theme
 */

import React from 'react';
import { Car, Hash, MapPin, Clock, Gauge, ArrowRight, ShieldCheck } from 'lucide-react';
import { VehicleTrajectory } from '../types';
import { formatTimeString } from '../utils/geo';

interface VehicleInfoCardProps {
  trajectory?: VehicleTrajectory;
  selectedPlate: string;
}

export const VehicleInfoCard: React.FC<VehicleInfoCardProps> = ({
  trajectory,
  selectedPlate,
}) => {
  if (!trajectory || trajectory.detections.length === 0) {
    return (
      <div className="bg-[#0F1117] rounded-2xl border border-white/10 p-5 shadow-xl flex flex-col justify-center items-center text-center min-h-[190px]">
        <Car className="w-8 h-8 text-slate-600 mb-2" />
        <p className="text-xs font-mono text-slate-400">No Vehicle Selected or Detected</p>
        <p className="text-[11px] text-slate-500 mt-1">
          Trigger CAM_A ➔ CAM_B to inspect real-time vehicle intelligence
        </p>
      </div>
    );
  }

  const latestDetection = trajectory.detections[trajectory.detections.length - 1];
  const isMultiHop = trajectory.detections.length >= 2;

  return (
    <div
      id="vehicle-info-card"
      className={`relative bg-[#0F1117] rounded-2xl border p-4.5 shadow-xl transition-all duration-300 ${
        trajectory.hasImpossibleTravel
          ? 'border-red-500/60 shadow-[0_0_20px_rgba(239,68,68,0.15)]'
          : 'border-white/10'
      }`}
    >
      {/* Top Banner: License Plate Badge & Confidence */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3.5 border-b border-white/10 mb-3.5">
        <div className="flex items-center gap-3">
          {/* Indian High Security Registration Plate Style Badge */}
          <div className="flex items-center rounded-lg border-2 border-slate-700 bg-amber-400 text-slate-950 px-3 py-1 font-mono font-extrabold text-sm tracking-widest shadow-md">
            <span className="text-[9px] mr-1.5 border-r border-slate-800/40 pr-1.5 text-slate-800 font-sans font-bold">
              IND
            </span>
            <span>{trajectory.plate}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-300 text-[11px] font-mono uppercase font-bold flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5" />
              {trajectory.vehicle_class}
            </span>
            <span className="px-2.5 py-0.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-[11px] font-mono flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-slate-400" />
              Track #{latestDetection.track_id}
            </span>
          </div>
        </div>

        {/* Confidence score */}
        <div className="flex items-center gap-2.5">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block font-mono uppercase">Confidence</span>
            <span className="text-xs font-mono font-bold text-green-400">
              {(latestDetection.plate_confidence * 100).toFixed(0)}%
            </span>
          </div>
          <div className="w-12 bg-black/40 h-2 rounded-full overflow-hidden border border-white/10">
            <div
              className="bg-green-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${latestDetection.plate_confidence * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Grid: Primary Attributes */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3.5">
        {/* Current Camera */}
        <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
          <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1 mb-1 uppercase">
            <MapPin className="w-3 h-3 text-blue-400" />
            Last Camera
          </span>
          <span className="text-sm font-mono font-bold text-blue-300 block">
            {latestDetection.camera_id}
          </span>
        </div>

        {/* Detection Timestamp */}
        <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
          <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1 mb-1 uppercase">
            <Clock className="w-3 h-3 text-blue-400" />
            Timestamp
          </span>
          <span className="text-xs font-mono font-semibold text-slate-200 block truncate">
            {formatTimeString(latestDetection.timestamp)}
          </span>
        </div>

        {/* Trajectory Distance */}
        <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
          <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1 mb-1 uppercase">
            <Gauge className="w-3 h-3 text-blue-400" />
            Distance
          </span>
          <span className="text-xs font-mono font-semibold text-slate-200 block">
            {isMultiHop ? `${trajectory.totalDistanceKm} km` : 'Initial Sighting'}
          </span>
        </div>

        {/* Calculated Speed / Time Delta */}
        <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
          <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1 mb-1 uppercase">
            <Gauge className="w-3 h-3 text-blue-400" />
            Computed Speed
          </span>
          <span
            className={`text-xs font-mono font-bold block ${
              trajectory.hasImpossibleTravel
                ? 'text-red-400'
                : isMultiHop
                ? 'text-blue-300'
                : 'text-slate-400'
            }`}
          >
            {isMultiHop
              ? `${trajectory.calculatedSpeedKmh} km/h (${trajectory.timeDeltaSeconds}s)`
              : 'Pending Match'}
          </span>
        </div>
      </div>

      {/* Multi-Camera Observation Sequence Chain */}
      <div className="bg-black/30 p-2.5 rounded-xl border border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-[11px]">Re-ID Hop:</span>
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            {trajectory.detections.map((d, index) => (
              <React.Fragment key={d.event_id}>
                {index > 0 && <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />}
                <span
                  className={`px-2.5 py-0.5 rounded-lg font-bold text-[11px] border ${
                    index === trajectory.detections.length - 1
                      ? 'bg-blue-500/20 border-blue-500 text-blue-200'
                      : 'bg-white/5 border-white/10 text-slate-400'
                  }`}
                >
                  {d.camera_id} ({formatTimeString(d.timestamp)})
                </span>
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="text-[11px] text-slate-400">
          {trajectory.detections.length >= 2 ? (
            <span className="text-green-400 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Automatically Matched
            </span>
          ) : (
            <span className="text-slate-500">Awaiting Downstream Camera Sighting...</span>
          )}
        </div>
      </div>
    </div>
  );
};
