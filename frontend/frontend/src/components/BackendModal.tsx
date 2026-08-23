/**
 * Backend Configuration Modal - Sleek Interface Theme
 */

import React, { useState } from 'react';
import { X, Server, Database, Check, ExternalLink, Code } from 'lucide-react';

interface BackendModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLiveBackend: boolean;
  apiUrl: string;
  onSave: (isLive: boolean, apiUrl: string) => void;
}

export const BackendModal: React.FC<BackendModalProps> = ({
  isOpen,
  onClose,
  isLiveBackend,
  apiUrl,
  onSave,
}) => {
  const [liveMode, setLiveMode] = useState<boolean>(isLiveBackend);
  const [customUrl, setCustomUrl] = useState<string>(apiUrl);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(liveMode, customUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0F1117] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden font-sans">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-white/10 bg-[#0F1117]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-mono">Backend Data Source</h3>
              <p className="text-xs text-slate-400">Sentinel-Traffic Integration Layer</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Mode Switch Card */}
          <div className="space-y-2.5">
            <label className="text-xs font-mono font-semibold text-slate-300 block uppercase">
              Data Ingestion Source
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Fixture Mode Card */}
              <div
                onClick={() => setLiveMode(false)}
                className={`cursor-pointer p-4 rounded-xl border transition-all ${
                  !liveMode
                    ? 'bg-blue-500/10 border-blue-500 text-blue-200 shadow-md'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono font-bold text-xs">USE_FIXTURES = true</span>
                  {!liveMode && <Check className="w-4 h-4 text-blue-400" />}
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Frozen Dataset (Bangalore CAM_A ➔ CAM_B)
                </p>
              </div>

              {/* Live FastAPI Backend Card */}
              <div
                onClick={() => setLiveMode(true)}
                className={`cursor-pointer p-4 rounded-xl border transition-all ${
                  liveMode
                    ? 'bg-amber-500/10 border-amber-500 text-amber-200 shadow-md'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono font-bold text-xs">LIVE FASTAPI</span>
                  {liveMode && <Check className="w-4 h-4 text-amber-400" />}
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Connect to live REST / WebSocket upstream service
                </p>
              </div>
            </div>
          </div>

          {/* API URL Input */}
          <div className="space-y-2">
            <label className="text-xs font-mono font-semibold text-slate-300 flex items-center justify-between">
              <span>FastAPI Backend Base URL</span>
              <span className="text-[10px] text-slate-500 font-mono">REST / JSON</span>
            </label>
            <input
              type="text"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="http://localhost:8000/api"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Backend Contract Overview Note */}
          <div className="bg-black/30 rounded-xl p-3.5 border border-white/10 text-xs text-slate-400 space-y-1.5">
            <div className="flex items-center gap-1.5 text-blue-400 font-mono font-semibold">
              <Code className="w-3.5 h-3.5" />
              <span>Frozen Upstream Contract Ready</span>
            </div>
            <p className="text-[11px] text-slate-400">
              The frontend receives standard <code className="text-slate-300 font-mono">DetectionEvent</code> JSON payloads from upstream Vision models via POST/GET endpoints without altering UI state logic.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4.5 border-t border-white/10 bg-[#0F1117]">
          <button
            onClick={onClose}
            className="cursor-pointer px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-mono transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="cursor-pointer px-4.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold shadow-lg transition-colors"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};
