/**
 * Sentinel-Traffic Header Component - Sleek Interface Theme
 */

import React, { useState, useEffect } from 'react';
import { Activity, Cpu, PlayCircle, RefreshCw, Layers } from 'lucide-react';
import { RiskLevel } from '../types';

interface HeaderProps {
  overallRisk: RiskLevel;
  isLiveBackend: boolean;
  totalCameras: number;
  onlineCameras: number;
  onRunJudgeDemo: () => void;
  onOpenSettings: () => void;
  onReset: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  overallRisk,
  isLiveBackend,
  totalCameras,
  onlineCameras,
  onRunJudgeDemo,
  onOpenSettings,
  onReset,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('2026-08-22 14:33:45');

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const timeStr = now.toISOString().replace('T', ' ').substring(0, 19);
      setCurrentTime(timeStr);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getRiskBadge = () => {
    switch (overallRisk) {
      case 'HIGH':
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/30 rounded-full">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_#ef4444]"></div>
            <span className="text-xs font-mono font-bold text-red-400 uppercase tracking-wider">
              RISK: HIGH
            </span>
          </div>
        );
      case 'MEDIUM':
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full">
            <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
            <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
              RISK: MEDIUM
            </span>
          </div>
        );
      case 'LOW':
      default:
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]"></div>
            <span className="text-xs font-medium text-green-400 uppercase tracking-widest">
              OPERATIONAL
            </span>
          </div>
        );
    }
  };

  return (
    <header className="flex items-center justify-between px-6 py-3.5 border-b border-white/10 bg-[#0F1117] z-20 shrink-0 select-none">
      {/* Brand Identity */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-[0_0_15px_rgba(59,130,246,0.35)]">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 01.553-.894L9 2l6 3 6-3V16.382a1 1 0 01-.553.894L15 20l-6-3z" />
          </svg>
        </div>
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold tracking-tight text-white font-sans">
            SENTINEL-TRAFFIC <span className="text-blue-500 font-mono text-sm ml-0.5">V1.0</span>
          </h1>
          <span className="hidden sm:inline-block text-[10px] uppercase font-mono px-2 py-0.5 bg-white/5 border border-white/10 rounded text-slate-400">
            GIS Core
          </span>
        </div>
      </div>

      {/* Center status and primary judge trigger */}
      <div className="flex items-center gap-3">
        {/* Hackathon Judge 1-Click Flow */}
        <button
          id="btn-run-judge-demo"
          onClick={onRunJudgeDemo}
          className="cursor-pointer group flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          title="Run 10-step Judge Flow: CAM_A -> CAM_B (Vehicle Match + High Risk + Impossible Travel)"
        >
          <PlayCircle className="w-4 h-4 text-white group-hover:rotate-45 transition-transform" />
          <span className="font-mono tracking-tight">Run Demo (CAM_A ➔ CAM_B)</span>
        </button>

        {/* Global Operational / Risk Badge */}
        <div className="hidden md:block">{getRiskBadge()}</div>
      </div>

      {/* Right controls: Live Timestamp, Backend source, Cams count, Reset */}
      <div className="flex items-center gap-3.5">
        {/* Live timestamp */}
        <div className="text-slate-400 text-xs font-mono hidden xl:block">
          {currentTime}
        </div>

        {/* Backend mode toggle */}
        <button
          id="btn-backend-settings"
          onClick={onOpenSettings}
          className="cursor-pointer flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 hover:border-white/20 rounded-lg text-xs font-mono text-slate-300 transition-colors"
          title="Configure backend mode"
        >
          <Cpu className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden sm:inline">
            {isLiveBackend ? 'LIVE API' : 'FIXTURES'}
          </span>
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isLiveBackend ? 'bg-amber-400' : 'bg-blue-400'
            }`}
          ></span>
        </button>

        {/* Cameras online status */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-mono text-slate-400">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          <span>
            {onlineCameras}/{totalCameras} CAMS
          </span>
        </div>

        {/* Reset button */}
        <button
          id="btn-reset-demo"
          onClick={onReset}
          className="cursor-pointer p-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          title="Reset Dashboard State"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
