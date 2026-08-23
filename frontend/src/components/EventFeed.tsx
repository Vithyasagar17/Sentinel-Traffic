/**
 * Live Event Feed & Frozen Contract Inspector Component - Sleek Interface Theme
 */

import React, { useState } from 'react';
import { Terminal, Code2, Eye, ShieldCheck, Check, Copy } from 'lucide-react';
import { DetectionEvent } from '../types';
import { formatTimeString } from '../utils/geo';

interface EventFeedProps {
  events: DetectionEvent[];
  selectedPlate: string;
  onSelectPlate: (plate: string) => void;
}

export const EventFeed: React.FC<EventFeedProps> = ({
  events,
  selectedPlate,
  onSelectPlate,
}) => {
  const [showJsonInspector, setShowJsonInspector] = useState<boolean>(false);
  const [inspectedEvent, setInspectedEvent] = useState<DetectionEvent | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const activeInspectEvent = inspectedEvent || events[0] || null;

  const handleCopyJson = () => {
    if (activeInspectEvent) {
      navigator.clipboard.writeText(JSON.stringify(activeInspectEvent, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-[#0F1117] rounded-2xl border border-white/10 p-4.5 shadow-xl flex flex-col h-full min-h-[260px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-white/10 mb-3.5">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-blue-400" />
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Detection Ingest Feed
          </h2>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400">
            {events.length} Events
          </span>
        </div>

        {/* View JSON Contract Switch */}
        <button
          id="btn-toggle-contract-json"
          onClick={() => setShowJsonInspector(!showJsonInspector)}
          className={`cursor-pointer flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-mono transition-colors ${
            showJsonInspector
              ? 'bg-blue-500/20 border-blue-500 text-blue-300'
              : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>{showJsonInspector ? 'Show Stream' : 'Frozen Contract JSON'}</span>
        </button>
      </div>

      {/* Main Content Area */}
      {showJsonInspector ? (
        /* Frozen Contract JSON Inspector for Judges */
        <div className="flex-1 flex flex-col bg-black/40 rounded-xl border border-white/10 p-3.5 font-mono text-xs overflow-hidden">
          <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2">
            <span className="text-[11px] text-blue-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-green-400" /> Frozen DetectionEvent Contract
            </span>
            <button
              onClick={handleCopyJson}
              className="flex items-center gap-1.5 text-[10px] text-slate-300 hover:text-white bg-white/5 px-2.5 py-1 rounded-lg border border-white/10 transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy JSON'}</span>
            </button>
          </div>
          <pre className="flex-1 overflow-auto text-[11px] text-slate-300 leading-relaxed scrollbar-thin">
            {activeInspectEvent
              ? JSON.stringify(activeInspectEvent, null, 2)
              : '// Trigger an event to see formatted JSON payload'}
          </pre>
        </div>
      ) : (
        /* Live Stream Rows */
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[320px]">
          {events.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-600 font-mono text-xs">
              <p>Waiting for detection events...</p>
              <p className="text-[10px] text-slate-500 mt-1">
                Click "Demo Flow" or trigger a camera above.
              </p>
            </div>
          ) : (
            events.map((ev) => {
              const isSelected = ev.plate === selectedPlate;
              return (
                <div
                  key={ev.event_id + '_' + ev.timestamp}
                  onClick={() => {
                    onSelectPlate(ev.plate);
                    setInspectedEvent(ev);
                  }}
                  className={`cursor-pointer p-2.5 rounded-xl border text-xs font-mono transition-all duration-150 flex items-center justify-between ${
                    isSelected
                      ? 'bg-blue-500/10 border-blue-500/60 text-slate-100 shadow-[0_0_10px_rgba(59,130,246,0.15)]'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-lg bg-black/40 border border-white/10 text-blue-400 font-bold text-[11px]">
                      {ev.camera_id}
                    </span>
                    <span className="font-bold text-amber-300">{ev.plate}</span>
                    <span className="text-[10px] text-slate-500 uppercase">({ev.vehicle_class})</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-400">
                      {formatTimeString(ev.timestamp)}
                    </span>
                    <span className="text-green-400 text-[10px] font-bold">
                      {(ev.plate_confidence * 100).toFixed(0)}%
                    </span>
                    <Eye className="w-3.5 h-3.5 text-slate-500 hover:text-blue-400" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
