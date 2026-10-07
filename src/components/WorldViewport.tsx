import React, { useEffect, useRef } from 'react';
import { WorldScene, LightingMode } from '../world/WorldScene';
import { FoodSpot } from '../types/foodSpot';
import { BuildingDef } from '../world/neighborhoodBuilder';

interface WorldViewportProps {
  spots: FoodSpot[];
  selectedSpot: FoodSpot | null;
  onSpotSelect: (spot: FoodSpot) => void;
  onSpotHover: (spot: FoodSpot | null, e?: MouseEvent) => void;
  onBackgroundClick?: () => void;
  onUserInteraction?: () => void;
  onCameraChange?: (azimuthDeg: number, pitchDeg: number) => void;
  onBuildingSelect?: (building: BuildingDef, worldPos: [number, number, number]) => void;
  lightingMode: LightingMode;
  sceneRef: React.MutableRefObject<WorldScene | null>;
}

export const WorldViewport: React.FC<WorldViewportProps> = ({
  spots,
  selectedSpot,
  onSpotSelect,
  onSpotHover,
  onBackgroundClick,
  onUserInteraction,
  onCameraChange,
  onBuildingSelect,
  lightingMode,
  sceneRef
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const callbacksRef = useRef({
    onSpotSelect,
    onSpotHover,
    onBackgroundClick,
    onUserInteraction,
    onCameraChange,
    onBuildingSelect
  });
  const spotsRef = useRef(spots);

  // Keep callback and data refs up to date on every render without triggering effects
  useEffect(() => {
    callbacksRef.current = {
      onSpotSelect,
      onSpotHover,
      onBackgroundClick,
      onUserInteraction,
      onCameraChange,
      onBuildingSelect
    };
    spotsRef.current = spots;
  });

  // Mount Three.js WorldScene exactly once
  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new WorldScene(mountRef.current, spotsRef.current, {
      onSpotSelect: spot => {
        const freshSpot = spotsRef.current.find(s => s.id === spot.id);
        const resolved = freshSpot ? { ...freshSpot, ...spot } : spot;
        callbacksRef.current.onSpotSelect(resolved);
      },
      onSpotHover: (spot, e) => {
        const freshSpot = spot ? (spotsRef.current.find(s => s.id === spot.id) || spot) : null;
        callbacksRef.current.onSpotHover(freshSpot, e);
      },
      onBackgroundClick: () => {
        callbacksRef.current.onBackgroundClick?.();
      },
      onUserInteraction: () => {
        callbacksRef.current.onUserInteraction?.();
      },
      onCameraChange: (azimuthDeg, pitchDeg) => {
        callbacksRef.current.onCameraChange?.(azimuthDeg, pitchDeg);
      },
      onBuildingSelect: (building, worldPos) => {
        callbacksRef.current.onBuildingSelect?.(building, worldPos);
      }
    });

    sceneRef.current = scene;
    (window as any).__THERU_WORLD__ = scene;

    return () => {
      scene.destroy();
      sceneRef.current = null;
      (window as any).__THERU_WORLD__ = null;
    };
  }, []);

  // Update lighting mode dynamically without recreating scene
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.applyLightingMode(lightingMode);
    }
  }, [lightingMode]);

  // Sync selected spot highlight ring without touching camera position or zoom
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.setSelectedSpot(selectedSpot ? selectedSpot.id : null);
    }
  }, [selectedSpot?.id]);

  return <div ref={mountRef} className="world-canvas-container" />;
};
