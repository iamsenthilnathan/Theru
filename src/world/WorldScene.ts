import * as THREE from 'three';
import { FoodSpot, LocationType } from '../types/foodSpot';
import { buildFoodStall, StallMeshBundle } from './stallBuilders';
import {
  buildStreetsAndGround,
  buildBuildings,
  buildEnvironment,
  BuildingDef,
  getBuildingById
} from './neighborhoodBuilder';
import { latLngToWorld, worldToLatLng } from '../services/geoService';
import { AnnotationManager } from './AnnotationManager';
import { findNearestRoad } from './roadNetwork';
import { getFacadeCueWorldTransform } from './buildingFacadeUtils';

export type LightingMode = 'dusk' | 'night' | 'day';

export interface PlacementResult {
  locationType: LocationType;
  latitude: number;
  longitude: number;
  worldPos: [number, number, number];
  building?: BuildingDef;
  roadName?: string;
  facingAngle?: number;
}

export interface PlacementHoverInfo {
  targetType: 'existing-building' | 'road-open-space' | 'invalid';
  screenX: number;
  screenY: number;
  worldPos: [number, number, number];
  building?: BuildingDef;
  roadName?: string;
  facingAngle?: number;
}

export interface WorldSceneCallbacks {
  onSpotSelect: (spot: FoodSpot) => void;
  onSpotHover: (spot: FoodSpot | null, mouseEvent?: MouseEvent) => void;
  onBackgroundClick?: () => void;
  onUserInteraction?: () => void;
  onCameraChange?: (azimuthDeg: number, pitchDeg: number) => void;
  onBuildingSelect?: (building: BuildingDef, worldPos: [number, number, number]) => void;
}

export class WorldScene {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private callbacks: WorldSceneCallbacks;
  private annotationManager: AnnotationManager;
  private currentSpots: FoodSpot[] = [];

  // Animation Loop
  private animId: number = 0;
  private clock: THREE.Clock = new THREE.Clock();

  // Perspective Orbital Map Camera State (Fixed Center Pivot)
  private currentTarget: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  private desiredTarget: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  private baseDistance: number = 46;
  private currentZoom: number = 1.0;
  private desiredZoom: number = 1.0;
  private minZoom: number = 0.45;
  private maxZoom: number = 2.6;

  // Camera Orbit Angles & Constraints
  private currentAzimuth: number = Math.PI / 4; // 45 deg initial
  private desiredAzimuth: number = Math.PI / 4;
  private currentPitch: number = 0.60; // ~34 deg initial (isometric exploration view)
  private desiredPitch: number = 0.60;
  private readonly minPitch: number = 0.35; // ~20 deg (low perspective view, skyline & depth)
  private readonly maxPitch: number = 1.35; // ~77 deg (top-down map view)
  private dragMode: 'pan' | 'rotate' = 'rotate';
  private dragStartAzimuth: number = Math.PI / 4;
  private dragStartPitch: number = 0.60;
  private lastReportedAzimuthDeg: number = -999;
  private lastReportedPitchDeg: number = -999;

  // Dragging & Panning
  private isPointerDown: boolean = false;
  private pointerStartX: number = 0;
  private pointerStartY: number = 0;
  private dragDistance: number = 0;
  private dragStartTarget: THREE.Vector3 = new THREE.Vector3();

  // Raycasting & Interaction
  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private mouse: THREE.Vector2 = new THREE.Vector2();
  private interactiveMeshes: THREE.Object3D[] = [];
  private groundMeshes: THREE.Object3D[] = [];
  private buildingMeshes: THREE.Object3D[] = [];
  private buildingSpotMap: Map<string, string[]> = new Map();
  private stallBundles: Map<string, StallMeshBundle> = new Map();
  private hoveredSpotId: string | null = null;
  private selectedSpotId: string | null = null;

  // Unified Placement Mode State (for Add Food Spot)
  private isPlacementMode: boolean = false;
  private placementPreviewGroup: THREE.Group | null = null;
  private placementPinMesh: THREE.Group | null = null;
  private onPlacementPick?: (result: PlacementResult) => void;
  private onPlacementHoverChange?: (info: PlacementHoverInfo | null) => void;
  private currentPlacementHover: PlacementHoverInfo | null = null;

  private lastConfirmedPlacement: { worldPosition: { x: number; y: number; z: number } } | null = null;
  private lastPreviewLog: any = null;
  private selectedBuildingHighlight: THREE.Group | null = null;

  // Lighting
  private ambientLight!: THREE.AmbientLight;
  private dirLight!: THREE.DirectionalLight;
  private hemiLight!: THREE.HemisphereLight;
  private streetLights: THREE.PointLight[] = [];
  private currentLightingMode: LightingMode = 'dusk';

  constructor(container: HTMLElement, spots: FoodSpot[], callbacks: WorldSceneCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.currentSpots = [...spots];

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xdce7f0);

    // 2. Camera (Perspective Orbital Map Camera with Fixed Center Pivot)
    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(36, aspect, 0.5, 450);
    this.updateCameraTransform();

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = false;
    container.appendChild(this.renderer.domElement);
    this.renderer.domElement.style.cursor = 'grab';

    // 4. WhereWeWork-Style 2D Billboard Annotation Layer
    this.annotationManager = new AnnotationManager(container, spots, {
      onSpotSelect: spot => this.callbacks.onSpotSelect(spot),
      onSpotHover: (spot, e) => this.callbacks.onSpotHover(spot, e)
    });

    // 5. Lighting
    this.setupLighting();

    // 6. Build City
    this.buildWorld(spots);

    // 7. Bind Events
    this.bindEvents();

    // 8. Start Animation
    this.animate();

    if (typeof window !== 'undefined') {
      (window as any).THREE = THREE;
      (window as any).__THERU_DEBUG__ = {
        scene: this,
        logs: [] as any[],
        getLastConfirmed: () => this.lastConfirmedPlacement,
        getLastPreview: () => this.lastPreviewLog,
        getStallBundle: (id: string) => this.stallBundles.get(id)
      };
    }
  }

  private setupLighting() {
    this.hemiLight = new THREE.HemisphereLight(0xdfeaf5, 0xcdd8cf, 0.72);
    this.scene.add(this.hemiLight);

    this.ambientLight = new THREE.AmbientLight(0xf2f6fa, 0.65);
    this.scene.add(this.ambientLight);

    this.dirLight = new THREE.DirectionalLight(0xfffaee, 1.35);
    this.dirLight.position.set(20, 35, 15);
    this.scene.add(this.dirLight);

    this.applyLightingMode('day');
  }

  public applyLightingMode(mode: LightingMode) {
    this.currentLightingMode = mode;
    if (mode === 'dusk') {
      // Soft, airy twilight with slate-blue sky and warm sunset directional glow
      this.scene.background = new THREE.Color(0xc9d5e3);
      this.ambientLight.color.setHex(0xb8c6d6);
      this.ambientLight.intensity = 0.55;
      this.dirLight.color.setHex(0xffb885);
      this.dirLight.intensity = 1.15;
      this.hemiLight.color.setHex(0xc5d3e4);
      this.hemiLight.intensity = 0.6;
      this.streetLights.forEach(l => (l.intensity = 1.1));
      this.stallBundles.forEach(b => b.light && (b.light.intensity = 1.5));
    } else if (mode === 'night') {
      // Deep midnight slate-blue
      this.scene.background = new THREE.Color(0x131720);
      this.ambientLight.color.setHex(0x354257);
      this.ambientLight.intensity = 0.35;
      this.dirLight.color.setHex(0x566782);
      this.dirLight.intensity = 0.3;
      this.hemiLight.color.setHex(0x283244);
      this.hemiLight.intensity = 0.4;
      this.streetLights.forEach(l => (l.intensity = 1.8));
      this.stallBundles.forEach(b => b.light && (b.light.intensity = 2.2));
    } else {
      // Crisp, pale blue sky with bright clean daylight
      this.scene.background = new THREE.Color(0xdce7f0);
      this.ambientLight.color.setHex(0xf5f8fb);
      this.ambientLight.intensity = 0.68;
      this.dirLight.color.setHex(0xfffaee);
      this.dirLight.intensity = 1.35;
      this.hemiLight.color.setHex(0xdfeaf5);
      this.hemiLight.intensity = 0.72;
      this.streetLights.forEach(l => (l.intensity = 0.2));
      this.stallBundles.forEach(b => b.light && (b.light.intensity = 0.7));
    }
  }

  public getLightingMode(): LightingMode {
    return this.currentLightingMode;
  }

  private buildWorld(spots: FoodSpot[]) {
    const streets = buildStreetsAndGround();
    this.scene.add(streets);

    // Collect ground & road meshes for placement raycasting
    streets.traverse(child => {
      if (child instanceof THREE.Mesh) {
        this.groundMeshes.push(child);
      }
    });

    const buildings = buildBuildings();
    this.scene.add(buildings);

    // Collect building meshes for selection and raycasting
    this.buildingMeshes = [];
    buildings.traverse(child => {
      if (child instanceof THREE.Mesh && (child.userData?.isBuildingMesh || child.userData?.isBuilding)) {
        this.buildingMeshes.push(child);
      }
    });

    // Map existing spots to buildings if buildingId is present
    this.buildingSpotMap.clear();
    spots.forEach(spot => {
      if (spot.buildingId) {
        const list = this.buildingSpotMap.get(spot.buildingId) || [];
        list.push(spot.id);
        this.buildingSpotMap.set(spot.buildingId, list);
      }
    });

    const env = buildEnvironment();
    this.scene.add(env.group);
    this.streetLights = env.streetLights;

    // Create 3D placement preview marker
    this.createPlacementPreview();

    spots.forEach(spot => {
      let spotIndex = 0;
      let totalSpots = 1;
      if (spot.buildingId) {
        const list = this.buildingSpotMap.get(spot.buildingId) || [spot.id];
        spotIndex = list.indexOf(spot.id);
        if (spotIndex < 0) spotIndex = 0;
        totalSpots = list.length;
      }

      const bundle = buildFoodStall(spot, spotIndex, totalSpots);
      this.scene.add(bundle.group);
      this.stallBundles.set(spot.id, bundle);

      bundle.group.userData = { ...bundle.group.userData, foodSpotId: spot.id, spot };
      bundle.group.traverse(child => {
        if (child instanceof THREE.Mesh) {
          child.userData = { ...child.userData, foodSpotId: spot.id, spot };
          this.interactiveMeshes.push(child);
        }
      });
    });
  }

  public selectSpotById(id: string) {
    const bundle = this.stallBundles.get(id);
    if (bundle && bundle.group.userData?.spot) {
      this.callbacks.onSpotSelect(bundle.group.userData.spot);
    }
  }

  private updateCameraTransform() {
    const dist = this.baseDistance / this.currentZoom;
    const x = dist * Math.cos(this.currentPitch) * Math.cos(this.currentAzimuth);
    const y = dist * Math.sin(this.currentPitch);
    const z = dist * Math.cos(this.currentPitch) * Math.sin(this.currentAzimuth);

    this.camera.position.set(
      this.currentTarget.x + x,
      this.currentTarget.y + y,
      this.currentTarget.z + z
    );
    this.camera.lookAt(this.currentTarget);

    const aspect = this.container.clientWidth / this.container.clientHeight;
    if (this.camera.aspect !== aspect) {
      this.camera.aspect = aspect;
      this.camera.updateProjectionMatrix();
    }

    // Report azimuth & pitch in degrees if changed noticeably
    const azDeg = Math.round((((this.currentAzimuth * 180) / Math.PI) % 360 + 360) % 360);
    const pitDeg = Math.round((this.currentPitch * 180) / Math.PI);
    if (
      Math.abs(azDeg - this.lastReportedAzimuthDeg) >= 1 ||
      Math.abs(pitDeg - this.lastReportedPitchDeg) >= 1
    ) {
      this.lastReportedAzimuthDeg = azDeg;
      this.lastReportedPitchDeg = pitDeg;
      if (this.callbacks.onCameraChange) {
        this.callbacks.onCameraChange(azDeg, pitDeg);
      }
    }
  }

  private onContextMenu = (e: MouseEvent) => {
    e.preventDefault();
  };

  private bindEvents() {
    const el = this.renderer.domElement;
    el.addEventListener('contextmenu', this.onContextMenu);
    this.container.addEventListener('contextmenu', this.onContextMenu);
    el.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    el.addEventListener('wheel', this.onWheel, { passive: false });
    window.addEventListener('resize', this.onResize);
  }

  private unbindEvents() {
    const el = this.renderer.domElement;
    el.removeEventListener('contextmenu', this.onContextMenu);
    this.container.removeEventListener('contextmenu', this.onContextMenu);
    el.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    el.removeEventListener('wheel', this.onWheel);
    window.removeEventListener('resize', this.onResize);
  }

  /**
   * Raycast against the horizontal ground plane (y = 0) to get exact, continuous world coordinates.
   */
  private getGroundIntersection(mouseScreen: THREE.Vector2): THREE.Vector3 | null {
    this.raycaster.setFromCamera(mouseScreen, this.camera);
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const hitPoint = new THREE.Vector3();
    const planeIntersection = this.raycaster.ray.intersectPlane(groundPlane, hitPoint);

    if (planeIntersection) {
      // Bound within continuous city slab [-36, 36]
      hitPoint.x = Math.max(-36, Math.min(36, hitPoint.x));
      hitPoint.y = 0;
      hitPoint.z = Math.max(-36, Math.min(36, hitPoint.z));
      return hitPoint;
    }
    return null;
  }

  private onPointerDown = (e: PointerEvent) => {
    this.isPointerDown = true;
    this.pointerStartX = e.clientX;
    this.pointerStartY = e.clientY;
    this.dragDistance = 0;
    this.dragStartTarget.copy(this.desiredTarget);

    if (e.button === 2) {
      // Right mouse button + drag -> PAN / MOVE THE MAP
      e.preventDefault();
      this.dragMode = 'pan';
      this.renderer.domElement.style.cursor = 'grabbing';
    } else {
      // Left mouse button + drag -> ORBIT / ROTATE CAMERA
      this.dragMode = 'rotate';
      this.desiredTarget.copy(this.currentTarget);
      this.dragStartAzimuth = this.desiredAzimuth;
      this.dragStartPitch = this.desiredPitch;
      this.renderer.domElement.style.cursor = 'grab';
    }
  };

  private onPointerMove = (e: PointerEvent) => {
    // 1. Dragging (Pan or Rotate)
    if (this.isPointerDown) {
      const dx = e.clientX - this.pointerStartX;
      const dy = e.clientY - this.pointerStartY;
      this.dragDistance = Math.hypot(dx, dy);

      if (this.dragDistance > 6) {
        this.callbacks.onUserInteraction?.();
      }

      if (this.dragMode === 'rotate') {
        const azimuthDelta = -(dx / 240) * Math.PI;
        const pitchDelta = (dy / 300) * 0.8;
        this.desiredAzimuth = this.dragStartAzimuth + azimuthDelta;
        this.desiredPitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.dragStartPitch + pitchDelta));
        return;
      }

      // Pan with rotation-aware ground vectors in perspective camera
      const halfFovRad = (this.camera.fov * Math.PI) / 360;
      const screenSpanY = 2 * (this.baseDistance / this.currentZoom) * Math.tan(halfFovRad);
      const s = screenSpanY / this.container.clientHeight;
      const moveScreenX = dx * s;
      const moveScreenY = (dy * s) / Math.max(0.2, Math.sin(this.currentPitch));

      const rightX = Math.sin(this.currentAzimuth);
      const rightZ = -Math.cos(this.currentAzimuth);
      const fwdX = -Math.cos(this.currentAzimuth);
      const fwdZ = -Math.sin(this.currentAzimuth);

      const deltaTargetX = moveScreenX * rightX + moveScreenY * fwdX;
      const deltaTargetZ = moveScreenX * rightZ + moveScreenY * fwdZ;

      this.desiredTarget.x = Math.max(-28, Math.min(28, this.dragStartTarget.x + deltaTargetX));
      this.desiredTarget.z = Math.max(-28, Math.min(28, this.dragStartTarget.z + deltaTargetZ));
      return;
    }

    const rect = this.renderer.domElement.getBoundingClientRect();
    if (
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom
    ) {
      if (this.placementPreviewGroup) {
        this.placementPreviewGroup.visible = false;
      }
      return;
    }

    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    // 2. Placement Mode Hover Raycasting (Automatic Building vs Roadside detection)
    if (this.isPlacementMode) {
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const bldgIntersects = this.raycaster.intersectObjects(this.buildingMeshes, false);

      if (bldgIntersects.length > 0) {
        const hit = bldgIntersects[0].object;
        const building: BuildingDef = hit.userData?.building;
        if (building) {
          this.highlightBuilding(building.id);
          if (this.placementPreviewGroup) {
            this.placementPreviewGroup.visible = false;
          }
          this.renderer.domElement.style.cursor = 'pointer';
          const hoverInfo: PlacementHoverInfo = {
            targetType: 'existing-building',
            screenX: e.clientX,
            screenY: e.clientY,
            worldPos: [building.x, building.h, building.z],
            building
          };
          this.currentPlacementHover = hoverInfo;
          this.lastPreviewLog = hoverInfo;
          this.onPlacementHoverChange?.(hoverInfo);
          return;
        }
      }

      // Pointer is not over a building -> clear building hover outline and test ground plane
      this.clearBuildingHighlight();
      const groundPoint = this.getGroundIntersection(this.mouse);
      if (groundPoint) {
        const road = findNearestRoad(groundPoint.x, groundPoint.z);
        if (road && road.isValidRoadside) {
          const sx = road.snappedRoadsidePoint.x;
          const sz = road.snappedRoadsidePoint.z;
          const facingAngle = road.facingAngle;

          if (this.placementPreviewGroup) {
            this.placementPreviewGroup.position.set(sx, 0.05, sz);
            this.placementPreviewGroup.rotation.y = facingAngle;
            this.placementPreviewGroup.visible = true;
            this.setPlacementPreviewValid(true);
          }

          this.renderer.domElement.style.cursor = 'pointer';
          const hoverInfo: PlacementHoverInfo = {
            targetType: 'road-open-space',
            screenX: e.clientX,
            screenY: e.clientY,
            worldPos: [sx, 0.05, sz],
            roadName: road.segment.name,
            facingAngle
          };
          this.currentPlacementHover = hoverInfo;
          this.lastPreviewLog = hoverInfo;
          this.onPlacementHoverChange?.(hoverInfo);
          return;
        } else {
          // Invalid ground (courtyard, decorative terrain, non-road interior)
          if (this.placementPreviewGroup) {
            this.placementPreviewGroup.position.set(groundPoint.x, 0.05, groundPoint.z);
            this.placementPreviewGroup.visible = true;
            this.setPlacementPreviewValid(false);
          }
          this.renderer.domElement.style.cursor = 'not-allowed';
          const hoverInfo: PlacementHoverInfo = {
            targetType: 'invalid',
            screenX: e.clientX,
            screenY: e.clientY,
            worldPos: [groundPoint.x, 0.05, groundPoint.z]
          };
          this.currentPlacementHover = hoverInfo;
          this.lastPreviewLog = hoverInfo;
          this.onPlacementHoverChange?.(hoverInfo);
          return;
        }
      }
      return;
    }

    // 4. Normal Hover Raycasting
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.interactiveMeshes, false);

    if (intersects.length > 0) {
      const hit = intersects[0].object;
      const spotId = hit.userData?.foodSpotId;
      const spot: FoodSpot | undefined = hit.userData?.spot;

      if (spotId && spot) {
        if (this.hoveredSpotId !== spotId) {
          this.setHoveredSpot(spotId);
          this.callbacks.onSpotHover(spot, e);
        }
        this.renderer.domElement.style.cursor = 'pointer';
        return;
      }
    }

    if (this.hoveredSpotId !== null) {
      this.setHoveredSpot(null);
      this.callbacks.onSpotHover(null);
      this.renderer.domElement.style.cursor = 'grab';
    }
  };

  private onPointerUp = (e: PointerEvent) => {
    this.isPointerDown = false;
    this.renderer.domElement.style.cursor = this.isPlacementMode
      ? 'crosshair'
      : (this.hoveredSpotId ? 'pointer' : 'grab');

    if (this.dragDistance < 8 && e.button === 0) {
      // Only process canvas clicks if the click directly targeted the WebGL canvas
      if (e.target !== this.renderer.domElement) {
        return;
      }

      const rect = this.renderer.domElement.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);

      // Unified Placement Mode Click
      if (this.isPlacementMode) {
        if (!this.currentPlacementHover || this.currentPlacementHover.targetType === 'invalid') {
          // Placement prevented on invalid ground!
          return;
        }

        if (this.currentPlacementHover.targetType === 'existing-building') {
          const building = this.currentPlacementHover.building!;
          const { latitude, longitude } = worldToLatLng(building.x, building.z);
          const worldPos: [number, number, number] = [building.x, 0, building.z];

          this.highlightBuilding(building.id);
          this.setPlacementPin(worldPos);
          if (this.placementPreviewGroup) this.placementPreviewGroup.visible = false;

          this.lastConfirmedPlacement = { worldPosition: { x: building.x, y: 0, z: building.z } };
          const callback = this.onPlacementPick;
          this.isPlacementMode = false;
          this.currentPlacementHover = null;
          this.renderer.domElement.style.cursor = 'grab';
          this.onPlacementHoverChange?.(null);

          if (callback) {
            callback({
              locationType: 'existing-building',
              latitude,
              longitude,
              worldPos,
              building
            });
          }
          return;
        }

        if (this.currentPlacementHover.targetType === 'road-open-space') {
          const worldPos = this.currentPlacementHover.worldPos;
          const { latitude, longitude } = worldToLatLng(worldPos[0], worldPos[2]);

          this.setPlacementPin(worldPos);
          if (this.placementPreviewGroup) this.placementPreviewGroup.visible = false;

          this.lastConfirmedPlacement = { worldPosition: { x: worldPos[0], y: worldPos[1], z: worldPos[2] } };
          const callback = this.onPlacementPick;
          const roadName = this.currentPlacementHover.roadName;
          const facingAngle = this.currentPlacementHover.facingAngle;

          this.isPlacementMode = false;
          this.currentPlacementHover = null;
          this.renderer.domElement.style.cursor = 'grab';
          this.onPlacementHoverChange?.(null);

          if (callback) {
            callback({
              locationType: 'open-space',
              latitude,
              longitude,
              worldPos,
              roadName,
              facingAngle
            });
          }
          return;
        }

        return;
      }


      // Normal Mode Click on Food Spot
      const intersects = this.raycaster.intersectObjects(this.interactiveMeshes, false);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        const spot: FoodSpot | undefined = hit.userData?.spot;
        if (spot) {
          this.callbacks.onUserInteraction?.();
          this.setSelectedSpot(spot.id);
          this.callbacks.onSpotSelect(spot);
          return;
        }
      }

      // Check if user clicked an existing building that has an associated food spot
      const bldgIntersects = this.raycaster.intersectObjects(this.buildingMeshes, false);
      if (bldgIntersects.length > 0) {
        const hit = bldgIntersects[0].object;
        const bldgId = hit.userData?.buildingId;
        if (bldgId && this.buildingSpotMap.has(bldgId)) {
          const spotIds = this.buildingSpotMap.get(bldgId);
          if (spotIds && spotIds.length > 0) {
            const firstSpotId = spotIds[0];
            const bundle = this.stallBundles.get(firstSpotId);
            const spot = bundle?.group.userData?.spot;
            if (spot) {
              this.callbacks.onUserInteraction?.();
              this.setSelectedSpot(spot.id);
              this.callbacks.onSpotSelect(spot);
              return;
            }
          }
        }
      }

      if (this.callbacks.onBackgroundClick) {
        this.callbacks.onBackgroundClick();
      }
    }
  };

  private onWheel = (e: WheelEvent) => {
    e.preventDefault();
    this.callbacks.onUserInteraction?.();
    const zoomDelta = -e.deltaY * 0.0015;
    this.desiredZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.desiredZoom + zoomDelta));
  };

  private onResize = () => {
    if (!this.container) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.updateCameraTransform();
  };

  private setHoveredSpot(id: string | null) {
    this.hoveredSpotId = id;
    if (this.annotationManager) {
      this.annotationManager.setHoveredSpot(id);
    }
  }

  public setSelectedSpot(id: string | null) {
    this.selectedSpotId = id;
    if (this.annotationManager) {
      this.annotationManager.setSelectedSpot(id);
    }
    this.stallBundles.forEach((bundle, spotId) => {
      const ring = bundle.beacon.getObjectByName('beaconRing') as THREE.Mesh;
      if (ring) {
        (ring.material as THREE.MeshBasicMaterial).color.setHex(spotId === id ? 0x00ff88 : 0xffffff);
        ring.scale.setScalar(spotId === id ? 1.4 : 1.0);
      }
      if (bundle.groundHalo) {
        const haloMat = bundle.groundHalo.material as THREE.MeshBasicMaterial;
        haloMat.color.setHex(spotId === id ? 0x00ff88 : (haloMat.userData.baseColor || 0xffa94d));
      }
    });
  }

  public focusOnSpot(spot: FoodSpot) {
    const [wx, , wz] = latLngToWorld(spot.latitude, spot.longitude);
    this.desiredTarget.set(wx, 0.5, wz);
    this.desiredZoom = 1.65;
    this.setSelectedSpot(spot.id);
  }

  public addFoodSpot(spot: FoodSpot) {
    this.cancelPlacementMode();
    this.currentSpots.push(spot);
    if (this.annotationManager) {
      this.annotationManager.setSpots(this.currentSpots);
    }

    if (spot.buildingId) {
      const list = this.buildingSpotMap.get(spot.buildingId) || [];
      if (!list.includes(spot.id)) list.push(spot.id);
      this.buildingSpotMap.set(spot.buildingId, list);

      // Rebalance all existing spots on this building to maintain slot offsets
      list.forEach((sId, idx) => {
        if (sId !== spot.id && spot.buildingId) {
          const existingBundle = this.stallBundles.get(sId);
          if (existingBundle) {
            const transform = getFacadeCueWorldTransform(spot.buildingId, idx, list.length);
            if (transform) {
              existingBundle.group.position.copy(transform.position);
              existingBundle.group.rotation.y = transform.rotationY;
              existingBundle.group.updateMatrixWorld(true);
            }
          }
        }
      });
    }
    const list = spot.buildingId ? this.buildingSpotMap.get(spot.buildingId) || [spot.id] : [spot.id];
    const spotIndex = list.indexOf(spot.id);
    const bundle = buildFoodStall(spot, spotIndex >= 0 ? spotIndex : 0, list.length);
    this.scene.add(bundle.group);
    this.stallBundles.set(spot.id, bundle);

    bundle.group.userData = { ...bundle.group.userData, foodSpotId: spot.id, spot };
    bundle.group.traverse(child => {
      if (child instanceof THREE.Mesh) {
        child.userData = { ...child.userData, foodSpotId: spot.id, spot };
        this.interactiveMeshes.push(child);
      }
    });

    const [expectedWx, expectedWy, expectedWz] = latLngToWorld(spot.latitude || 0, spot.longitude || 0);
    const finalLocalPos = bundle.group.position;

    bundle.group.updateMatrixWorld(true);
    const finalWorldPos = new THREE.Vector3();
    bundle.group.getWorldPosition(finalWorldPos);

    // Complete hierarchical mesh trace of every child Object3D and Mesh
    const meshTrace: Array<{
      name: string;
      type: string;
      localPosition: { x: number; y: number; z: number };
      worldPosition: { x: number; y: number; z: number };
      parentName: string;
      visible: boolean;
    }> = [];

    bundle.group.traverse(child => {
      const wp = new THREE.Vector3();
      child.getWorldPosition(wp);
      meshTrace.push({
        name: child.name || (child instanceof THREE.Mesh ? 'unnamed-mesh' : child.type),
        type: child.type,
        localPosition: {
          x: Number(child.position.x.toFixed(4)),
          y: Number(child.position.y.toFixed(4)),
          z: Number(child.position.z.toFixed(4))
        },
        worldPosition: {
          x: Number(wp.x.toFixed(4)),
          y: Number(wp.y.toFixed(4)),
          z: Number(wp.z.toFixed(4))
        },
        parentName: child.parent?.name || (child.parent === this.scene ? 'rootScene' : 'unknown'),
        visible: child.visible
      });
    });

    console.log('[STALL MESH TRACE]', JSON.stringify({
      id: spot.id,
      name: spot.name,
      setupType: spot.setupType || 'none',
      stallGroupWorldPosition: {
        x: Number(finalWorldPos.x.toFixed(4)),
        y: Number(finalWorldPos.y.toFixed(4)),
        z: Number(finalWorldPos.z.toFixed(4))
      },
      childCount: meshTrace.length,
      children: meshTrace
    }));

    if ((window as any).__THERU_DEBUG__) {
      (window as any).__THERU_DEBUG__.logs.push({
        type: 'STALL_MESH_TRACE',
        data: { id: spot.id, name: spot.name, meshTrace }
      });
    }

    const logDData = {
      id: spot.id,
      name: spot.name,
      latLng: {
        latitude: spot.latitude != null ? Number(spot.latitude.toFixed(6)) : 0,
        longitude: spot.longitude != null ? Number(spot.longitude.toFixed(6)) : 0
      },
      latLngToWorldResult: {
        x: Number(expectedWx.toFixed(4)),
        y: Number(expectedWy.toFixed(4)),
        z: Number(expectedWz.toFixed(4))
      },
      finalStallGroupPosition: {
        x: Number(finalLocalPos.x.toFixed(4)),
        y: Number(finalLocalPos.y.toFixed(4)),
        z: Number(finalLocalPos.z.toFixed(4))
      }
    };
    console.log('[LOG D - RENDERING]', JSON.stringify(logDData));
    if ((window as any).__THERU_DEBUG__) {
      (window as any).__THERU_DEBUG__.logs.push({ type: 'LOG_D', data: logDData });
    }

    const worldCheckData = {
      id: spot.id,
      stallGroupWorldPosition: {
        x: Number(finalWorldPos.x.toFixed(4)),
        y: Number(finalWorldPos.y.toFixed(4)),
        z: Number(finalWorldPos.z.toFixed(4))
      },
      parentName: bundle.group.parent?.name || (bundle.group.parent === this.scene ? 'rootScene' : 'unknown'),
      parentPosition: bundle.group.parent ? {
        x: Number(bundle.group.parent.position.x.toFixed(4)),
        y: Number(bundle.group.parent.position.y.toFixed(4)),
        z: Number(bundle.group.parent.position.z.toFixed(4))
      } : null,
      rotation: {
        x: Number(bundle.group.rotation.x.toFixed(4)),
        y: Number(bundle.group.rotation.y.toFixed(4)),
        z: Number(bundle.group.rotation.z.toFixed(4))
      },
      scale: {
        x: Number(bundle.group.scale.x.toFixed(4)),
        y: Number(bundle.group.scale.y.toFixed(4)),
        z: Number(bundle.group.scale.z.toFixed(4))
      }
    };
    console.log('[WORLD POSITION CHECK]', JSON.stringify(worldCheckData));
    if ((window as any).__THERU_DEBUG__) {
      (window as any).__THERU_DEBUG__.logs.push({ type: 'WORLD_CHECK', data: worldCheckData });
    }

    // Development assertions
    const diffLocalExpected = Math.hypot(
      finalLocalPos.x - expectedWx,
      finalLocalPos.z - expectedWz
    );
    const diffWorldExpected = Math.hypot(
      finalWorldPos.x - expectedWx,
      finalWorldPos.z - expectedWz
    );
    const diffFromConfirmed = this.lastConfirmedPlacement
      ? Math.hypot(
          finalWorldPos.x - this.lastConfirmedPlacement.worldPosition.x,
          finalWorldPos.z - this.lastConfirmedPlacement.worldPosition.z
        )
      : null;

    const assertionData = {
      diffLocalExpected: Number(diffLocalExpected.toFixed(6)),
      diffWorldExpected: Number(diffWorldExpected.toFixed(6)),
      hasLastConfirmed: Boolean(this.lastConfirmedPlacement),
      diffFromConfirmed: diffFromConfirmed !== null ? Number(diffFromConfirmed.toFixed(6)) : null
    };
    console.log('[ASSERTION CHECK]', JSON.stringify(assertionData));
    if ((window as any).__THERU_DEBUG__) {
      (window as any).__THERU_DEBUG__.logs.push({ type: 'ASSERTION', data: assertionData });
    }

    if (diffLocalExpected > 0.001 || diffWorldExpected > 0.001) {
      console.error(
        `[ASSERTION FAILED] Coordinate mismatch! diffLocal=${diffLocalExpected}, diffWorld=${diffWorldExpected}`
      );
    }

    this.clearPlacementPin();
    this.setSelectedSpot(spot.id);
  }

  // --- Placement Mode Helpers ---
  private createPlacementPreview() {
    this.placementPreviewGroup = new THREE.Group();
    this.placementPreviewGroup.name = 'placement-preview';
    this.placementPreviewGroup.visible = false;

    // Glowing ground circle
    const ringGeom = new THREE.RingGeometry(0.48, 0.72, 32);
    ringGeom.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x0ca678,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    ring.name = 'previewRing';
    this.placementPreviewGroup.add(ring);

    // Facing direction arrow pointing toward road (in +Z local direction)
    const arrowGeom = new THREE.ConeGeometry(0.18, 0.45, 3);
    arrowGeom.rotateX(Math.PI / 2);
    arrowGeom.rotateY(Math.PI);
    const arrowMat = new THREE.MeshBasicMaterial({ color: 0x0ca678 });
    const arrow = new THREE.Mesh(arrowGeom, arrowMat);
    arrow.name = 'previewArrow';
    arrow.position.set(0, 0.03, 0.85);
    this.placementPreviewGroup.add(arrow);

    // Pin stem
    const stemGeom = new THREE.CylinderGeometry(0.04, 0.02, 1.2, 8);
    const stemMat = new THREE.MeshLambertMaterial({ color: 0x0ca678 });
    const stem = new THREE.Mesh(stemGeom, stemMat);
    stem.name = 'previewStem';
    stem.position.y = 0.6;
    this.placementPreviewGroup.add(stem);

    // Pin head sphere
    const headGeom = new THREE.SphereGeometry(0.2, 12, 12);
    const headMat = new THREE.MeshLambertMaterial({ color: 0x0ca678 });
    const head = new THREE.Mesh(headGeom, headMat);
    head.name = 'previewHead';
    head.position.y = 1.2;
    this.placementPreviewGroup.add(head);

    this.scene.add(this.placementPreviewGroup);
  }

  private setPlacementPreviewValid(isValid: boolean) {
    if (!this.placementPreviewGroup) return;
    this.placementPreviewGroup.traverse(child => {
      if (child instanceof THREE.Mesh) {
        if (child.name === 'previewRing') {
          (child.material as THREE.MeshBasicMaterial).color.setHex(isValid ? 0x0ca678 : 0xe03131);
          (child.material as THREE.MeshBasicMaterial).opacity = isValid ? 0.75 : 0.35;
        } else if (child.name === 'previewArrow') {
          child.visible = isValid;
        } else if (child.material instanceof THREE.MeshLambertMaterial) {
          child.material.color.setHex(isValid ? 0x0ca678 : 0xc92a2a);
        }
      }
    });
  }

  public startPlacementMode(
    onPick: (result: PlacementResult) => void,
    onHover?: (info: PlacementHoverInfo | null) => void
  ) {
    this.isPlacementMode = true;
    this.onPlacementPick = onPick;
    this.onPlacementHoverChange = onHover;
    this.currentPlacementHover = null;
    this.renderer.domElement.style.cursor = 'crosshair';
    if (this.placementPreviewGroup) {
      this.placementPreviewGroup.visible = false;
    }
    this.clearPlacementPin();
    this.clearBuildingHighlight();
  }

  public cancelPlacementMode() {
    this.isPlacementMode = false;
    this.onPlacementPick = undefined;
    this.onPlacementHoverChange = undefined;
    this.currentPlacementHover = null;
    this.renderer.domElement.style.cursor = 'grab';
    if (this.placementPreviewGroup) {
      this.placementPreviewGroup.visible = false;
    }
    this.clearPlacementPin();
    this.clearBuildingHighlight();
  }

  public setPlacementPin(worldPos: [number, number, number]) {
    this.clearPlacementPin();

    const pinGroup = new THREE.Group();
    pinGroup.name = 'fixed-placement-pin';
    pinGroup.position.set(worldPos[0], worldPos[1], worldPos[2]);

    // Ground ring
    const ringGeom = new THREE.RingGeometry(0.4, 0.6, 24);
    ringGeom.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x228be6, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    ring.position.y = 0.02;

    // Pin stem
    const stemGeom = new THREE.CylinderGeometry(0.04, 0.02, 1.2, 8);
    const stemMat = new THREE.MeshLambertMaterial({ color: 0x228be6 });
    const stem = new THREE.Mesh(stemGeom, stemMat);
    stem.position.y = 0.6;

    // Pin head
    const headGeom = new THREE.SphereGeometry(0.22, 12, 12);
    const headMat = new THREE.MeshLambertMaterial({ color: 0x1971c2 });
    const head = new THREE.Mesh(headGeom, headMat);
    head.position.y = 1.2;

    pinGroup.add(ring, stem, head);
    this.scene.add(pinGroup);
    this.placementPinMesh = pinGroup;
  }

  public clearPlacementPin() {
    if (this.placementPinMesh) {
      this.scene.remove(this.placementPinMesh);
      this.placementPinMesh = null;
    }
  }

  public resetView() {
    this.desiredTarget.set(0, 0, 0);
    this.desiredZoom = 1.0;
    this.desiredAzimuth = Math.PI / 4;
    this.desiredPitch = 0.60;
    this.setSelectedSpot(null);
  }

  public highlightBuilding(buildingId: string | null) {
    this.clearBuildingHighlight();
    if (!buildingId) return;

    const building = getBuildingById(buildingId);
    if (!building) return;

    const highlightGroup = new THREE.Group();
    highlightGroup.name = 'selected-building-highlight';

    // Glowing perimeter outline around building footprint
    const boxGeom = new THREE.BoxGeometry(
      building.w + 0.35,
      building.h + 0.25,
      building.d + 0.35
    );
    const edges = new THREE.EdgesGeometry(boxGeom);
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x228be6,
      linewidth: 2
    });
    const wireframe = new THREE.LineSegments(edges, lineMat);
    wireframe.position.set(building.x, building.h / 2 + 0.05, building.z);
    highlightGroup.add(wireframe);

    // Glowing ring beacon perched above building roof
    const ringGeom = new THREE.RingGeometry(0.45, 0.7, 24);
    ringGeom.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x228be6,
      side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    ring.position.set(building.x, building.h + 0.5, building.z);
    highlightGroup.add(ring);

    this.scene.add(highlightGroup);
    this.selectedBuildingHighlight = highlightGroup;
  }

  public clearBuildingHighlight() {
    if (this.selectedBuildingHighlight) {
      this.scene.remove(this.selectedBuildingHighlight);
      this.selectedBuildingHighlight = null;
    }
  }

  // --- Controlled 3D Camera Orbit Controls ---
  public rotateLeft(angleRad: number = Math.PI / 4) {
    this.desiredAzimuth -= angleRad;
  }

  public rotateRight(angleRad: number = Math.PI / 4) {
    this.desiredAzimuth += angleRad;
  }

  public cycleTilt() {
    // Cycle between:
    // ~34 deg (0.60 rad, isometric) -> ~72 deg (1.25 rad, top-down map) -> ~24 deg (0.42 rad, low perspective view)
    if (this.desiredPitch < 0.5) {
      this.desiredPitch = 0.60;
    } else if (this.desiredPitch < 0.85) {
      this.desiredPitch = 1.25;
    } else {
      this.desiredPitch = 0.42;
    }
  }

  public setTilt(pitchRad: number) {
    this.desiredPitch = Math.max(this.minPitch, Math.min(this.maxPitch, pitchRad));
  }

  public resetRotation() {
    this.desiredAzimuth = Math.PI / 4;
    this.desiredPitch = 0.60;
  }

  public getAzimuth(): number {
    return this.currentAzimuth;
  }

  public getPitch(): number {
    return this.currentPitch;
  }

  public zoomIn() {
    this.desiredZoom = Math.min(this.maxZoom, this.desiredZoom + 0.3);
  }

  public zoomOut() {
    this.desiredZoom = Math.max(this.minZoom, this.desiredZoom - 0.3);
  }

  private animate = () => {
    this.animId = requestAnimationFrame(this.animate);

    this.clock.getDelta();
    const elapsed = this.clock.getElapsedTime();

    this.currentTarget.lerp(this.desiredTarget, 0.09);
    this.currentZoom += (this.desiredZoom - this.currentZoom) * 0.1;
    this.currentAzimuth += (this.desiredAzimuth - this.currentAzimuth) * 0.12;
    this.currentPitch += (this.desiredPitch - this.currentPitch) * 0.12;
    this.updateCameraTransform();

    // Update WhereWeWork-style 2D billboard annotations on every frame
    if (this.annotationManager) {
      this.annotationManager.update(
        this.camera,
        this.container.clientWidth,
        this.container.clientHeight,
        this.currentZoom
      );
    }

    // Zoom factor for progressive discovery (0 at wide city view zoom=0.5, 1.0 at street inspection zoom >= 1.3)
    const zoomProgress = THREE.MathUtils.clamp((this.currentZoom - 0.5) / 0.8, 0, 1);

    this.stallBundles.forEach((bundle, spotId) => {
      if (bundle.steams) {
        bundle.steams.forEach(sMesh => {
          sMesh.position.y += (sMesh.userData.speed || 0.015);
          sMesh.scale.addScalar(0.003);
          const mat = sMesh.material as THREE.MeshLambertMaterial;
          mat.opacity = Math.max(0, 0.6 - (sMesh.position.y - sMesh.userData.initialY) * 0.7);

          if (sMesh.position.y > sMesh.userData.initialY + 0.75) {
            sMesh.position.y = sMesh.userData.initialY;
            sMesh.scale.set(1, 1, 1);
            mat.opacity = 0.55;
          }
        });
      }

      const isHovered = spotId === this.hoveredSpotId;
      const isSelected = spotId === this.selectedSpotId;

      // 1. Subtle idle beacon floating & zoom-based scaling
      if (bundle.beacon) {
        const floatOffset = Math.sin(elapsed * 2.2 + bundle.beacon.position.x) * 0.08;
        bundle.beacon.position.y = 3.3 + floatOffset;
        const targetBeaconScale = (isHovered ? 1.25 : (isSelected ? 1.2 : 1.0)) * THREE.MathUtils.lerp(0.65, 1.0, zoomProgress);
        bundle.beacon.scale.setScalar(THREE.MathUtils.lerp(bundle.beacon.scale.x, targetBeaconScale, 0.15));
      }

      // 2. Subtle ground halo pulse & interactive hover/selection affordance
      if (bundle.groundHalo) {
        const pulse = Math.sin(elapsed * 1.8 + bundle.group.position.x * 0.4);
        const baseHaloOpacity = 0.28 + pulse * 0.08;
        const targetHaloScale = isHovered ? 1.14 : (isSelected ? 1.22 : 1.0);
        bundle.groundHalo.scale.setScalar(THREE.MathUtils.lerp(bundle.groundHalo.scale.x, targetHaloScale, 0.12));

        const haloMat = bundle.groundHalo.material as THREE.MeshBasicMaterial;
        const activeOpacity = (isHovered ? 0.6 : (isSelected ? 0.75 : baseHaloOpacity)) * THREE.MathUtils.lerp(0.35, 1.0, zoomProgress);
        haloMat.opacity = activeOpacity;
      }

      // 3. Gentle tactile hover scale response (restrained 5% scale lift)
      const targetStallScale = isHovered ? 1.05 : (isSelected ? 1.04 : 1.0);
      bundle.group.scale.setScalar(THREE.MathUtils.lerp(bundle.group.scale.x, targetStallScale, 0.14));

      // 4. Subtle lighting response on hover and zoom
      if (bundle.light) {
        const baseIntensity = this.currentLightingMode === 'night' ? 2.2 : (this.currentLightingMode === 'dusk' ? 1.5 : 0.7);
        const lightBoost = isHovered ? 1.35 : (isSelected ? 1.45 : 1.0);
        const targetLightIntensity = baseIntensity * lightBoost * THREE.MathUtils.lerp(0.6, 1.0, zoomProgress);
        bundle.light.intensity = THREE.MathUtils.lerp(bundle.light.intensity, targetLightIntensity, 0.1);
      }
    });

    this.renderer.render(this.scene, this.camera);
  };

  public destroy() {
    cancelAnimationFrame(this.animId);
    this.unbindEvents();
    if (this.annotationManager) {
      this.annotationManager.destroy();
    }
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
    this.renderer.dispose();
  }
}
