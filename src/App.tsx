import React, { useState, useEffect, useRef } from 'react';
import { foodSpotService, CreateFoodSpotInput } from './services/foodSpotService';
import { FoodSpot, SetupType, LocationType } from './types/foodSpot';
import { WorldScene, LightingMode, PlacementResult, PlacementHoverInfo } from './world/WorldScene';
import { WorldViewport } from './components/WorldViewport';
import { TopSearchBar } from './components/TopSearchBar';
import { FoodDetailPanel } from './components/FoodDetailPanel';
import { WorldControls, getLocalLightingMode } from './components/WorldControls';
import { HoverTooltip } from './components/HoverTooltip';
import { PlacementBanner } from './components/PlacementBanner';
import { AddFoodSpotModal } from './components/AddFoodSpotModal';
import { Compass, X, Store, MapPin, AlertCircle } from 'lucide-react';
import './App.css';

export const App: React.FC = () => {
  const [spots, setSpots] = useState<FoodSpot[]>([]);
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'about' | 'community'>('about');
  const [hoveredSpot, setHoveredSpot] = useState<FoodSpot | null>(null);
  const [hoverCoords, setHoverCoords] = useState<{ x: number; y: number } | null>(null);
  const [isAutoLighting, setIsAutoLighting] = useState<boolean>(true);
  const [lightingMode, setLightingMode] = useState<LightingMode>(() => getLocalLightingMode().lightingMode);
  const [isLoading, setIsLoading] = useState(true);

  // Camera Orbit angles for dynamic compass and controls
  const [cameraAngles, setCameraAngles] = useState({ azimuthDeg: 45, pitchDeg: 33 });

  // First-use discovery hint state (dismissible or naturally disappears after first interaction)
  const [firstUseDismissed, setFirstUseDismissed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('theru_first_use_seen') === 'true';
    } catch {
      return false;
    }
  });

  const dismissFirstUse = () => {
    setFirstUseDismissed(true);
    try {
      sessionStorage.setItem('theru_first_use_seen', 'true');
    } catch {
      // ignore
    }
  };

  // Add Food Spot Flow State (Unified Placement & Map Hover)
  const [isPlacingSpot, setIsPlacingSpot] = useState(false);
  const [placementResult, setPlacementResult] = useState<PlacementResult | null>(null);
  const [placementHover, setPlacementHover] = useState<PlacementHoverInfo | null>(null);
  const [communityNotice, setCommunityNotice] = useState<string | null>(null);

  const sceneRef = useRef<WorldScene | null>(null);

  // Load initial geographic food spots
  useEffect(() => {
    foodSpotService.getAllSpots().then(data => {
      setSpots(data);
      setIsLoading(false);
    });
  }, []);

  // Selected food spot derived directly from state (guarantees live persistence)
  const selectedSpot = spots.find(s => s.id === selectedSpotId) || null;

  const handleSpotSelect = (spot: FoodSpot) => {
    dismissFirstUse();
    setSelectedSpotId(spot.id);
    setCommunityNotice(null);
    setSpots(prev => prev.map(s => (s.id === spot.id ? { ...s, ...spot } : s)));
    if (sceneRef.current) {
      sceneRef.current.setSelectedSpot(spot.id);
    }
  };

  const handleClosePanel = () => {
    setSelectedSpotId(null);
    setCommunityNotice(null);
    if (sceneRef.current) {
      sceneRef.current.setSelectedSpot(null);
    }
  };

  // Manual lighting selection overrides auto
  const handleSelectManualLighting = (mode: LightingMode) => {
    setIsAutoLighting(false);
    setLightingMode(mode);
  };

  // Reset to auto lighting based on user's local clock
  const handleResetAutoLighting = () => {
    setIsAutoLighting(true);
    const local = getLocalLightingMode();
    setLightingMode(local.lightingMode);
  };

  // Periodically re-sync lighting with local clock if in auto mode
  useEffect(() => {
    if (!isAutoLighting) return;
    const interval = setInterval(() => {
      const local = getLocalLightingMode();
      setLightingMode(prev => (prev !== local.lightingMode ? local.lightingMode : prev));
    }, 60000);
    return () => clearInterval(interval);
  }, [isAutoLighting]);

  const handleSpotHover = (spot: FoodSpot | null, e?: MouseEvent) => {
    setHoveredSpot(spot);
    if (spot && e) {
      setHoverCoords({ x: e.clientX, y: e.clientY });
    } else {
      setHoverCoords(null);
    }
  };

  // --- Add Food Spot Workflow (Unified Direct Placement) ---
  const handleStartAddSpot = () => {
    dismissFirstUse();
    handleClosePanel();
    setIsPlacingSpot(true);
    setPlacementResult(null);
    setPlacementHover(null);

    if (sceneRef.current) {
      sceneRef.current.clearBuildingHighlight();
      sceneRef.current.clearPlacementPin();
      sceneRef.current.startPlacementMode(
        result => {
          setPlacementResult(result);
          setIsPlacingSpot(false);
          setPlacementHover(null);
        },
        hover => {
          setPlacementHover(hover);
        }
      );
    }
  };

  const handleCancelPlacement = () => {
    setIsPlacingSpot(false);
    setPlacementHover(null);
    if (sceneRef.current) {
      sceneRef.current.cancelPlacementMode();
      sceneRef.current.clearBuildingHighlight();
      if (!placementResult) {
        sceneRef.current.clearPlacementPin();
      }
    }
  };

  const handleRepositionOnMap = () => {
    setIsPlacingSpot(true);
    setPlacementHover(null);
    if (sceneRef.current) {
      sceneRef.current.clearBuildingHighlight();
      sceneRef.current.clearPlacementPin();
      sceneRef.current.startPlacementMode(
        result => {
          setPlacementResult(result);
          setIsPlacingSpot(false);
          setPlacementHover(null);
        },
        hover => {
          setPlacementHover(hover);
        }
      );
    }
  };

  const handleCloseAddModal = () => {
    setPlacementResult(null);
    setPlacementHover(null);
    setIsPlacingSpot(false);
    if (sceneRef.current) {
      sceneRef.current.cancelPlacementMode();
      sceneRef.current.clearBuildingHighlight();
      sceneRef.current.clearPlacementPin();
    }
  };

  const handleCreateSpot = async (spotData: {
    name: string;
    officialName?: string;
    category?: string;
    latitude: number;
    longitude: number;
    description?: string;
    streetName?: string;
    signatureDish?: string;
    initialRecommendation?: string;
    locationType?: LocationType;
    buildingId?: string;
    setupType?: SetupType;
    priceMin?: number;
    priceMax?: number;
    photos?: string[];
  }) => {
    const input: CreateFoodSpotInput = {
      ...spotData,
      locationType: spotData.locationType || placementResult?.locationType || 'open-space',
      buildingId: spotData.buildingId || placementResult?.building?.id,
      createdBy: 'You'
    };

    const newSpot = await foodSpotService.createFoodSpot(input);
    setSpots(prev => [...prev, newSpot]);

    // Visually render new stall on the 3D map and focus on it
    if (sceneRef.current) {
      sceneRef.current.cancelPlacementMode();
      sceneRef.current.clearBuildingHighlight();
      sceneRef.current.clearPlacementPin();
      sceneRef.current.addFoodSpot(newSpot);
    }

    setPlacementResult(null);
    setPlacementHover(null);
    setIsPlacingSpot(false);
    setSelectedSpotId(newSpot.id);
    setActiveTab('about');
  };

  const handleOpenExistingSpot = (spot: FoodSpot) => {
    handleCloseAddModal();
    setSelectedSpotId(spot.id);
    if (sceneRef.current) {
      sceneRef.current.focusOnSpot(spot);
    }
    setActiveTab('community');
    setCommunityNotice(
      'This place was found near your selected location. You can contribute your recommendations, local tips, and comments here!'
    );
  };

  // --- Community In-Memory Actions (Persistent across tabs & spot switches) ---
  const handleAgreeRecommendation = async (spotId: string, recId: string) => {
    const updated = await foodSpotService.agreeRecommendation(spotId, recId);
    if (updated) {
      setSpots(prev => prev.map(s => (s.id === spotId ? updated : s)));
    }
  };

  const handleAddRecommendation = async (
    spotId: string,
    dishName: string,
    description: string
  ) => {
    const updated = await foodSpotService.addRecommendation(spotId, dishName, description);
    if (updated) {
      setSpots(prev => prev.map(s => (s.id === spotId ? updated : s)));
    }
  };

  const handleAddComment = async (spotId: string, text: string, authorName?: string) => {
    const updated = await foodSpotService.addComment(spotId, text, authorName);
    if (updated) {
      setSpots(prev => prev.map(s => (s.id === spotId ? updated : s)));
    }
  };

  const handleLikeComment = async (spotId: string, commentId: string) => {
    const updated = await foodSpotService.likeComment(spotId, commentId);
    if (updated) {
      setSpots(prev => prev.map(s => (s.id === spotId ? updated : s)));
    }
  };

  const handleAddReply = async (
    spotId: string,
    commentId: string,
    text: string,
    authorName?: string
  ) => {
    const updated = await foodSpotService.addReply(spotId, commentId, text, authorName);
    if (updated) {
      setSpots(prev => prev.map(s => (s.id === spotId ? updated : s)));
    }
  };

  return (
    <div className={`app-container theme-${lightingMode} ${selectedSpot ? 'detail-panel-open' : ''}`}>
      {/* 3D Isometric Viewport */}
      {!isLoading && (
        <WorldViewport
          spots={spots}
          selectedSpot={selectedSpot}
          onSpotSelect={handleSpotSelect}
          onSpotHover={handleSpotHover}
          onBackgroundClick={() => {
            // Click on ground keeps current panel
          }}
          onUserInteraction={dismissFirstUse}
          onCameraChange={(azimuthDeg, pitchDeg) => setCameraAngles({ azimuthDeg, pitchDeg })}
          lightingMode={lightingMode}
          sceneRef={sceneRef}
        />
      )}

      {/* Top Floating Search, Branding & "+ Add food spot" Action */}
      <TopSearchBar
        spots={spots}
        onSelectSpot={handleSpotSelect}
        selectedSpot={selectedSpot}
        onStartAddSpot={handleStartAddSpot}
      />

      {/* Interactive Map Placement Mode Banner */}
      {isPlacingSpot && (
        <PlacementBanner
          hoverInfo={placementHover}
          onCancel={handleCancelPlacement}
        />
      )}

      {/* Dynamic Cursor HUD Indicator during map placement */}
      {isPlacingSpot && placementHover && (
        <div
          className={`placement-cursor-hud target-${placementHover.targetType}`}
          style={{
            left: `${placementHover.screenX + 16}px`,
            top: `${placementHover.screenY - 14}px`
          }}
        >
          {placementHover.targetType === 'existing-building' && (
            <>
              <Store size={14} className="hud-icon" />
              <span>Attach to {placementHover.building?.name || 'Building'}</span>
            </>
          )}
          {placementHover.targetType === 'road-open-space' && (
            <>
              <MapPin size={14} className="hud-icon" />
              <span>Place on {placementHover.roadName || 'Roadside'}</span>
            </>
          )}
          {placementHover.targetType === 'invalid' && (
            <>
              <AlertCircle size={14} className="hud-icon" />
              <span>Cannot place here</span>
            </>
          )}
        </div>
      )}

      {/* World Controls (Secondary Zoom, Small Compass, Day/Dusk/Night, Auto) */}
      <WorldControls
        onZoomIn={() => sceneRef.current?.zoomIn()}
        onZoomOut={() => sceneRef.current?.zoomOut()}
        onResetRotation={() => sceneRef.current?.resetRotation()}
        azimuthDeg={cameraAngles.azimuthDeg}
        lightingMode={lightingMode}
        isAutoLighting={isAutoLighting}
        onToggleLighting={setLightingMode}
        onSelectManualLighting={handleSelectManualLighting}
        onResetAutoLighting={handleResetAutoLighting}
      />

      {/* Guidance Hint & First-Use Discovery */}
      {!isPlacingSpot && (
        <div className="exploration-hint">
          <Compass size={13} className="hint-icon" />
          {!firstUseDismissed ? (
            <>
              <span className="first-use-text">Left-drag to orbit · Right-drag to move · Scroll to zoom</span>
              <button
                type="button"
                className="hint-dismiss-btn"
                onClick={dismissFirstUse}
                aria-label="Dismiss hint"
              >
                <X size={11} />
              </button>
            </>
          ) : (
            <>
              <span className="hint-desktop">Left-drag to orbit · Right-drag to move · Scroll to zoom</span>
              <span className="hint-mobile">Explore the map · Zoom in · Tap a food spot</span>
            </>
          )}
        </div>
      )}

      {/* Hover Preview Tooltip */}
      <HoverTooltip spot={hoveredSpot} coords={hoverCoords} />

      {/* Add Food Spot Modal with Live Duplicate Assessment (Kept mounted during repositioning) */}
      {placementResult && (
        <div style={{ display: isPlacingSpot ? 'none' : 'contents' }}>
          <AddFoodSpotModal
            location={{
              latitude: placementResult.latitude,
              longitude: placementResult.longitude,
              worldPos: placementResult.worldPos
            }}
            locationType={placementResult.locationType}
            selectedBuilding={placementResult.building}
            roadName={placementResult.roadName}
            onClose={handleCloseAddModal}
            onReposition={handleRepositionOnMap}
            onCreateSpot={handleCreateSpot}
            onOpenExistingSpot={handleOpenExistingSpot}
          />
        </div>
      )}

      {/* Food Detail Panel (Persistent [About] and [Community] Tabs) */}
      <FoodDetailPanel
        spot={selectedSpot}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onClose={handleClosePanel}
        onAgreeRecommendation={handleAgreeRecommendation}
        onAddRecommendation={handleAddRecommendation}
        onAddComment={handleAddComment}
        onLikeComment={handleLikeComment}
        onAddReply={handleAddReply}
        communityNotice={communityNotice}
        onDismissNotice={() => setCommunityNotice(null)}
      />
    </div>
  );
};

export default App;
