/**
 * SIH Sentinel-Traffic - Main Dashboard
 * Sleek Interface Theme
 */

import React, { useState } from 'react';
import { Header } from './components/Header';
import { CameraStatusPanel } from './components/CameraStatusPanel';
import { TrafficMap } from './components/Map/TrafficMap';
import { VehicleInfoCard } from './components/VehicleInfoCard';
import { TrafficRiskBadge } from './components/TrafficRiskBadge';
import { AnomalyAlertBanner } from './components/AnomalyAlertBanner';
import { SimulationControls } from './components/SimulationControls';
import { EventFeed } from './components/EventFeed';
import { BackendModal } from './components/BackendModal';
import { useSentinelTraffic } from './hooks/useSentinelTraffic';

export default function App() {
  const {
    cameras,
    events,
    selectedPlate,
    setSelectedPlate,
    selectedTrajectory,
    activeScenario,
    currentStepIndex,
    totalSteps,
    isPlaying,
    setIsPlaying,
    playbackSpeedMs,
    setPlaybackSpeedMs,
    isLiveBackend,
    apiUrl,
    lastEmittedEvent,
    overallRisk,
    stepForward,
    resetDemo,
    runFullJudgeDemo,
    changeScenario,
    injectCustomEvent,
    toggleBackendMode,
  } = useSentinelTraffic();

  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [showFeedDrawer, setShowFeedDrawer] = useState<boolean>(false);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0A0B0E] text-slate-100 font-sans selection:bg-blue-500 selection:text-white">
      {/* Top Application Header */}
      <Header
        overallRisk={overallRisk}
        isLiveBackend={isLiveBackend}
        totalCameras={cameras.length}
        onlineCameras={cameras.filter((c) => c.status === 'online').length}
        onRunJudgeDemo={runFullJudgeDemo}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onReset={resetDemo}
      />

      {/* Main Operational Canvas */}
      <main className="flex-1 flex flex-col p-3 sm:p-4.5 gap-3.5 overflow-hidden">
        {/* Top Floating / Anomaly Banner (triggers on impossible travel) */}
        {selectedTrajectory?.hasImpossibleTravel && (
          <div className="shrink-0">
            <AnomalyAlertBanner
              alerts={[]}
              trajectory={selectedTrajectory}
              onViewContract={() => setShowFeedDrawer(true)}
            />
          </div>
        )}

        {/* Center Grid: Left Cameras, Center GIS Map, Right/Bottom Intel */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3.5 min-h-0">
          {/* Left Column: Live Camera Status (3 cols on desktop) */}
          <div className="hidden lg:flex lg:col-span-3 flex-col min-h-0 overflow-hidden">
            <CameraStatusPanel
              cameras={cameras}
              lastEmittedEvent={lastEmittedEvent}
              onTriggerCamera={(camId) => injectCustomEvent(camId)}
            />
          </div>

          {/* Center Column: Interactive GIS Map & Trajectory (6 cols on desktop) */}
          <div className="col-span-1 lg:col-span-6 flex flex-col min-h-0 overflow-hidden gap-3">
            {/* GIS Map */}
            <div className="flex-1 min-h-[340px]">
              <TrafficMap
                cameras={cameras}
                selectedTrajectory={selectedTrajectory}
                lastEmittedEvent={lastEmittedEvent}
                onCameraClick={(camId) => injectCustomEvent(camId)}
              />
            </div>

            {/* Simulation & Playback Bar */}
            <div className="shrink-0">
              <SimulationControls
                isPlaying={isPlaying}
                onTogglePlay={() => setIsPlaying(!isPlaying)}
                onStepForward={stepForward}
                onReset={resetDemo}
                currentStepIndex={currentStepIndex}
                totalSteps={totalSteps}
                activeScenario={activeScenario}
                onChangeScenario={changeScenario}
                playbackSpeedMs={playbackSpeedMs}
                onChangePlaybackSpeed={setPlaybackSpeedMs}
              />
            </div>
          </div>

          {/* Right Column: Live Ingest Feed & Contract Viewer (3 cols on desktop) */}
          <div className="hidden lg:flex lg:col-span-3 flex-col min-h-0 overflow-hidden">
            <EventFeed
              events={events}
              selectedPlate={selectedPlate}
              onSelectPlate={setSelectedPlate}
            />
          </div>
        </div>

        {/* Bottom Section: Vehicle Intelligence & Traffic Risk Assessment */}
        <div className="shrink-0 grid grid-cols-1 md:grid-cols-12 gap-3.5">
          {/* Vehicle Information (8 cols) */}
          <div className="md:col-span-8">
            <VehicleInfoCard
              trajectory={selectedTrajectory}
              selectedPlate={selectedPlate}
            />
          </div>

          {/* Traffic Risk Assessment Panel (4 cols) */}
          <div className="md:col-span-4 flex flex-col justify-between">
            <TrafficRiskBadge
              riskLevel={selectedTrajectory?.riskLevel || overallRisk}
              trajectory={selectedTrajectory}
            />
          </div>
        </div>
      </main>

      {/* Mobile/Tablet Fallback drawer for Camera List & Feed */}
      <div className="lg:hidden p-2.5 bg-[#0F1117] border-t border-white/10 flex items-center justify-around text-xs font-mono">
        <button
          onClick={() => setShowFeedDrawer(!showFeedDrawer)}
          className="px-3.5 py-1.5 rounded-xl bg-blue-600 text-white font-semibold shadow"
        >
          {showFeedDrawer ? 'Hide Event Feed' : 'View Detection Feed'}
        </button>
      </div>

      {showFeedDrawer && (
        <div className="fixed inset-0 z-40 bg-black/90 p-4 flex flex-col lg:hidden">
          <div className="flex justify-between items-center pb-2.5 mb-2.5 border-b border-white/10">
            <span className="font-mono font-bold text-blue-400">Detection Events Stream</span>
            <button
              onClick={() => setShowFeedDrawer(false)}
              className="px-3 py-1 bg-white/10 text-white rounded-lg text-xs font-mono"
            >
              Close
            </button>
          </div>
          <div className="flex-1 overflow-auto">
            <EventFeed
              events={events}
              selectedPlate={selectedPlate}
              onSelectPlate={setSelectedPlate}
            />
          </div>
        </div>
      )}

      {/* Backend & Fixtures Settings Modal */}
      <BackendModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        isLiveBackend={isLiveBackend}
        apiUrl={apiUrl}
        onSave={toggleBackendMode}
      />
    </div>
  );
}
