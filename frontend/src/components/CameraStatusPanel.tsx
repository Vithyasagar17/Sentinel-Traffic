/**
 * Live Camera Status Component - Sleek Interface Theme
 */

import React from 'react';
import { Camera, Radio, Zap } from 'lucide-react';
import { CameraNode, DetectionEvent } from '../types';
import { formatTimeString } from '../utils/geo';

interface CameraStatusPanelProps {
  cameras: CameraNode[];
  lastEmittedEvent: DetectionEvent | null;
  onTriggerCamera: (cameraId: string) => void;
}

export const CameraStatusPanel: React.FC<CameraStatusPanelProps> = ({
  cameras,
  lastEmittedEvent,
  onTriggerCamera,
}) => {
  return (
    <div className="flex flex-col h-full bg-[#0F1117] rounded-2xl border border-white/10 p-4 shadow-xl select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3.5">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-blue-400" />
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Live Camera Status
          </h2>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-slate-300">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
          <span>{cameras.filter((c) => c.status === 'online').length} ACTIVE</span>
        </div>
      </div>

      {/* Camera Nodes List */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
        {cameras.map((cam) => {
          const isLatestPing = lastEmittedEvent?.camera_id === cam.id;
          const isOnline = cam.status === 'online';

          return (
            <div
              key={cam.id}
              id={`cam-card-${cam.id}`}
              className={`p-3 rounded-xl border transition-all duration-200 ${
                isLatestPing
                  ? 'bg-blue-500/10 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                  : 'bg-white/5 border-white/10 hover:border-white/20'
              }`}
            >
              {/* Row 1: ID, Online Status & Manual Trigger */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-blue-400">{cam.id}</span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                      isOnline
                        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isOnline ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    ></span>
                    {cam.status.toUpperCase()}
                  </span>
                </div>

                {/* Quick trigger button for manual judge test */}
                <button
                  id={`btn-trigger-${cam.id}`}
                  onClick={() => onTriggerCamera(cam.id)}
                  className="cursor-pointer flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-white/5 border border-white/10 hover:border-blue-500/50 hover:bg-blue-500/10 text-[10px] font-mono text-slate-300 hover:text-blue-300 transition-colors"
                  title={`Emit simulated detection event at ${cam.id}`}
                >
                  <Zap className="w-2.5 h-2.5 text-blue-400" />
                  <span>Emit</span>
                </button>
              </div>

              {/* Row 2: Camera Name / Intersection */}
              <div className="text-xs text-slate-200 font-medium truncate mb-0.5">
                {cam.name}
              </div>
              <div className="text-[11px] text-slate-400 truncate mb-2.5">
                {cam.locationName}
              </div>

              {/* Row 3: Metrics (Detections count & Last Seen time) */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-[11px] font-mono">
                <div className="bg-black/30 px-2.5 py-1 rounded-lg border border-white/5">
                  <span className="text-slate-500 text-[10px] block uppercase">Detections</span>
                  <span className="text-slate-100 font-bold">{cam.detectionCount}</span>
                </div>
                <div className="bg-black/30 px-2.5 py-1 rounded-lg border border-white/5">
                  <span className="text-slate-500 text-[10px] block uppercase">Last Seen</span>
                  <span className="text-blue-400 truncate block">
                    {cam.lastDetectionTime ? formatTimeString(cam.lastDetectionTime) : '--:--:--'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
