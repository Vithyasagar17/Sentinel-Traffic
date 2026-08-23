/**
 * useSentinelTraffic Hook
 * Central state orchestration for SIH Sentinel-Traffic Dashboard
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { CameraNode, DetectionEvent, RiskLevel, TrafficAlert, VehicleTrajectory } from '../types';
import {
  getCameras,
  getEvents,
  getAlerts,
  postDetectionEvent,
  resetSimulationData,
  USE_FIXTURES,
  setUseFixtures,
  setApiBaseUrl,
  API_BASE_URL,
} from '../services/api';
import {
  PRIMARY_DEMO_EVENTS,
  MULTI_HOP_DEMO_EVENTS,
  NORMAL_COMMUTER_EVENTS,
  AMBIENT_BACKGROUND_EVENTS,
} from '../data/fixtures';

export type DemoScenario = 'primary' | 'multihop' | 'normal';

export function useSentinelTraffic() {
  const [cameras, setCameras] = useState<CameraNode[]>([]);
  const [events, setEvents] = useState<DetectionEvent[]>([]);
  const [trajectories, setTrajectories] = useState<Record<string, VehicleTrajectory>>({});
  const [alerts, setAlerts] = useState<TrafficAlert[]>([]);
  const [selectedPlate, setSelectedPlate] = useState<string>('KA01AB1234');
  const [activeScenario, setActiveScenario] = useState<DemoScenario>('primary');
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeedMs, setPlaybackSpeedMs] = useState<number>(2500);
  const [isLiveBackend, setIsLiveBackend] = useState<boolean>(!USE_FIXTURES);
  const [apiUrl, setApiUrl] = useState<string>(API_BASE_URL);
  const [lastEmittedEvent, setLastEmittedEvent] = useState<DetectionEvent | null>(null);

  const timerRef = useRef<number | null>(null);

  // Load initial cameras
  const refreshData = useCallback(async () => {
    const camList = await getCameras();
    setCameras(camList);
    const evList = await getEvents(50);
    setEvents(evList);
    const alertList = await getAlerts();
    setAlerts(alertList);
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Handle scenario events dataset
  const getScenarioEvents = useCallback((): DetectionEvent[] => {
    switch (activeScenario) {
      case 'primary':
        return PRIMARY_DEMO_EVENTS;
      case 'multihop':
        return MULTI_HOP_DEMO_EVENTS;
      case 'normal':
        return NORMAL_COMMUTER_EVENTS;
      default:
        return PRIMARY_DEMO_EVENTS;
    }
  }, [activeScenario]);

  // Emit a single detection event into the system
  const emitEvent = useCallback(
    async (event: DetectionEvent) => {
      setLastEmittedEvent(event);
      const res = await postDetectionEvent(event);
      if (res.success) {
        setEvents((prev) => [event, ...prev]);
        setTrajectories((prev) => ({
          ...prev,
          [event.plate]: res.trajectory,
        }));
        setSelectedPlate(event.plate);

        if (res.alert) {
          setAlerts((prev) => {
            const exists = prev.some((a) => a.id === res.alert?.id);
            if (exists) return prev;
            return [res.alert!, ...prev];
          });
        }

        // Refresh camera detection counts
        const updatedCams = await getCameras();
        setCameras(updatedCams);
      }
    },
    []
  );

  // Step to the next event in the active scenario
  const stepForward = useCallback(async () => {
    const scenarioEvents = getScenarioEvents();
    if (currentStepIndex < scenarioEvents.length) {
      const nextEvent = scenarioEvents[currentStepIndex];
      await emitEvent(nextEvent);
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      setIsPlaying(false);
    }
  }, [currentStepIndex, getScenarioEvents, emitEvent]);

  // Step back / Reset simulation
  const resetDemo = useCallback(() => {
    setIsPlaying(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    resetSimulationData();
    setEvents([]);
    setTrajectories({});
    setAlerts([]);
    setCurrentStepIndex(0);
    setLastEmittedEvent(null);
    refreshData();
  }, [refreshData]);

  // Execute full automated Judge Demo Flow (Step 1 -> Step 2)
  const runFullJudgeDemo = useCallback(async () => {
    resetDemo();
    setActiveScenario('primary');
    // Step 1: CAM_A
    await emitEvent(PRIMARY_DEMO_EVENTS[0]);
    setCurrentStepIndex(1);

    // After 1.5 seconds, Step 2: CAM_B
    setTimeout(async () => {
      await emitEvent(PRIMARY_DEMO_EVENTS[1]);
      setCurrentStepIndex(2);
    }, 1200);
  }, [resetDemo, emitEvent]);

  // Handle auto-playback loop
  useEffect(() => {
    if (isPlaying) {
      const scenarioEvents = getScenarioEvents();
      if (currentStepIndex >= scenarioEvents.length) {
        setIsPlaying(false);
        return;
      }

      timerRef.current = window.setInterval(() => {
        stepForward();
      }, playbackSpeedMs);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, currentStepIndex, getScenarioEvents, stepForward, playbackSpeedMs]);

  // Switch scenario
  const changeScenario = useCallback(
    (scenario: DemoScenario) => {
      resetDemo();
      setActiveScenario(scenario);
      if (scenario === 'normal') {
        setSelectedPlate('KA05MH8844');
      } else {
        setSelectedPlate('KA01AB1234');
      }
    },
    [resetDemo]
  );

  // Manual event injector for testing arbitrary camera pings
  const injectCustomEvent = useCallback(
    async (cameraId: string, customPlate?: string) => {
      const cam = cameras.find((c) => c.id === cameraId);
      if (!cam) return;

      const plateToUse = customPlate || selectedPlate || 'KA01AB1234';
      const now = new Date();
      const timestamp = now.toISOString().replace('Z', '').split('.')[0];

      const newEvent: DetectionEvent = {
        event_id: `manual_${Date.now()}`,
        camera_id: cameraId,
        timestamp,
        plate: plateToUse,
        plate_confidence: Number((0.9 + Math.random() * 0.09).toFixed(2)),
        vehicle_class: 'car',
        latitude: cam.latitude,
        longitude: cam.longitude,
        track_id: Math.floor(Math.random() * 90) + 10,
      };

      await emitEvent(newEvent);
    },
    [cameras, selectedPlate, emitEvent]
  );

  // Toggle backend mode between Fixtures & Live FastAPI
  const toggleBackendMode = useCallback(
    (useLive: boolean, customUrl?: string) => {
      setIsLiveBackend(useLive);
      setUseFixtures(!useLive);
      if (customUrl) {
        setApiUrl(customUrl);
        setApiBaseUrl(customUrl);
      }
      resetDemo();
    },
    [resetDemo]
  );

  // Derive active selected trajectory
  const selectedTrajectory: VehicleTrajectory | undefined = trajectories[selectedPlate];

  // Derive system overview risk level
  const trajectoryList = Object.values(trajectories) as VehicleTrajectory[];
  const overallRisk: RiskLevel = trajectoryList.some((t) => t.riskLevel === 'HIGH')
    ? 'HIGH'
    : trajectoryList.some((t) => t.riskLevel === 'MEDIUM')
    ? 'MEDIUM'
    : 'LOW';

  return {
    cameras,
    events,
    trajectories,
    alerts,
    selectedPlate,
    setSelectedPlate,
    selectedTrajectory,
    activeScenario,
    currentStepIndex,
    isPlaying,
    setIsPlaying,
    playbackSpeedMs,
    setPlaybackSpeedMs,
    isLiveBackend,
    apiUrl,
    lastEmittedEvent,
    overallRisk,
    totalSteps: getScenarioEvents().length,
    stepForward,
    resetDemo,
    runFullJudgeDemo,
    changeScenario,
    injectCustomEvent,
    toggleBackendMode,
  };
}
