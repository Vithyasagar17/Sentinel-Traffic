/**
 * Simulation Controls Component - Sleek Interface Theme
 */

import React from 'react';
import { Play, Pause, SkipForward, RotateCcw, FastForward, Sliders } from 'lucide-react';
import { DemoScenario } from '../hooks/useSentinelTraffic';

interface SimulationControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onStepForward: () => void;
  onReset: () => void;
  currentStepIndex: number;
  totalSteps: number;
  activeScenario: DemoScenario;
  onChangeScenario: (scenario: DemoScenario) => void;
  playbackSpeedMs: number;
  onChangePlaybackSpeed: (ms: number) => void;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  isPlaying,
  onTogglePlay,
  onStepForward,
  onReset,
  currentStepIndex,
  totalSteps,
  activeScenario,
  onChangeScenario,
  playbackSpeedMs,
  onChangePlaybackSpeed,
}) => {
  const steps = [
    { title: 'CAM_A Detection', desc: 'Sighting at MG Road' },
    { title: 'CAM_B Detection', desc: 'Sighting at Indiranagar' },
    ...(activeScenario === 'multihop'
      ? [{ title: 'CAM_C Detection', desc: 'Sighting at Koramangala' }]
      : []),
  ];

  return (
    <div className="bg-[#0F1117] rounded-2xl border border-white/10 p-3.5 shadow-xl">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
        {/* Left: Step Progression Indicators */}
        <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0">
          <span className="text-[11px] font-mono font-bold text-slate-400 uppercase mr-1 shrink-0">
            Flow:
          </span>
          {steps.map((step, idx) => {
            const isCompleted = currentStepIndex > idx;
            const isCurrent = currentStepIndex === idx;

            return (
              <div
                key={idx}
                className={`flex items-center gap-2 px-3 py-1 rounded-xl border text-xs font-mono transition-all duration-200 shrink-0 ${
                  isCompleted
                    ? 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                    : isCurrent
                    ? 'bg-white/10 border-blue-400 text-white shadow-[0_0_12px_rgba(59,130,246,0.3)]'
                    : 'bg-white/5 border-white/10 text-slate-400'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isCompleted
                      ? 'bg-blue-600 text-white'
                      : isCurrent
                      ? 'bg-blue-400 text-slate-950 animate-pulse'
                      : 'bg-white/10 text-slate-400'
                  }`}
                >
                  {idx + 1}
                </span>
                <span>{step.title}</span>
              </div>
            );
          })}
        </div>

        {/* Center & Right: Playback Buttons & Scenario Switcher */}
        <div className="flex flex-wrap items-center justify-between lg:justify-end gap-2.5 w-full lg:w-auto">
          {/* Scenario selector */}
          <div className="flex items-center gap-1 bg-black/30 p-1 rounded-xl border border-white/10 text-xs font-mono">
            <span className="text-[10px] text-slate-500 px-1.5 hidden sm:inline uppercase">Scenario:</span>
            <button
              id="btn-scenario-primary"
              onClick={() => onChangeScenario('primary')}
              className={`cursor-pointer px-2.5 py-1 rounded-lg text-[11px] transition-colors ${
                activeScenario === 'primary'
                  ? 'bg-blue-600 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Impossible Travel (2-Cam)
            </button>
            <button
              id="btn-scenario-multihop"
              onClick={() => onChangeScenario('multihop')}
              className={`cursor-pointer px-2.5 py-1 rounded-lg text-[11px] transition-colors ${
                activeScenario === 'multihop'
                  ? 'bg-blue-600 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Corridor (3-Cam)
            </button>
            <button
              id="btn-scenario-normal"
              onClick={() => onChangeScenario('normal')}
              className={`cursor-pointer px-2.5 py-1 rounded-lg text-[11px] transition-colors ${
                activeScenario === 'normal'
                  ? 'bg-blue-600 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Normal Commuter
            </button>
          </div>

          {/* Primary Playback controls */}
          <div className="flex items-center gap-1.5">
            {/* Play / Pause */}
            <button
              id="btn-toggle-play"
              onClick={onTogglePlay}
              disabled={currentStepIndex >= totalSteps && !isPlaying}
              className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-mono font-bold shadow-md transition-all"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? 'Pause' : 'Play Auto'}</span>
            </button>

            {/* Step forward */}
            <button
              id="btn-step-forward"
              onClick={onStepForward}
              disabled={currentStepIndex >= totalSteps}
              className="cursor-pointer flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-50 text-slate-200 text-xs font-mono transition-colors"
              title="Trigger Next Detection Event"
            >
              <SkipForward className="w-3.5 h-3.5 text-blue-400" />
              <span>Next</span>
            </button>

            {/* Reset */}
            <button
              id="btn-controls-reset"
              onClick={onReset}
              className="cursor-pointer flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-slate-200 text-xs font-mono transition-colors"
              title="Reset Simulation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
