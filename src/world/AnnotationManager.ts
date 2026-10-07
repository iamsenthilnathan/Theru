import * as THREE from 'three';
import { FoodSpot } from '../types/foodSpot';
import { latLngToWorld } from '../services/geoService';
import { getBuildingById } from './neighborhoodBuilder';

export interface AnnotationCallbacks {
  onSpotSelect: (spot: FoodSpot) => void;
  onSpotHover: (spot: FoodSpot | null, e?: MouseEvent) => void;
}

interface SpotAnnotationNode {
  spot: FoodSpot;
  labelEl: HTMLDivElement;
  avatarEl: HTMLSpanElement;
  nameEl: HTMLSpanElement;
  lineEl: SVGLineElement;
  dotEl: SVGCircleElement;
  baseStemHeight: number;
  anchorWorld: THREE.Vector3;
  currentScreenPos: { x: number; y: number };
  visible: boolean;
  isCulled: boolean;
}

interface BoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export class AnnotationManager {
  private container: HTMLElement;
  private callbacks: AnnotationCallbacks;
  private overlayRoot: HTMLDivElement;
  private svgRoot: SVGSVGElement;
  private labelsContainer: HTMLDivElement;
  private centerReticle: HTMLDivElement;
  private nodes: Map<string, SpotAnnotationNode> = new Map();
  private spots: FoodSpot[] = [];
  private selectedSpotId: string | null = null;
  private hoveredSpotId: string | null = null;

  constructor(container: HTMLElement, spots: FoodSpot[], callbacks: AnnotationCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.spots = spots;

    // 1. Create main annotation overlay
    this.overlayRoot = document.createElement('div');
    this.overlayRoot.className = 'theru-annotation-overlay wherewework-annotation-container';
    this.overlayRoot.style.position = 'absolute';
    this.overlayRoot.style.inset = '0';
    this.overlayRoot.style.pointerEvents = 'none';
    this.overlayRoot.style.overflow = 'hidden';
    this.overlayRoot.style.zIndex = 'var(--z-annotations, 100)';

    // 2. SVG sublayer for leader lines and anchor dots
    this.svgRoot = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svgRoot.setAttribute('class', 'annotation-connectors-svg');
    this.svgRoot.style.position = 'absolute';
    this.svgRoot.style.inset = '0';
    this.svgRoot.style.width = '100%';
    this.svgRoot.style.height = '100%';
    this.svgRoot.style.pointerEvents = 'none';
    this.svgRoot.style.overflow = 'visible';
    this.overlayRoot.appendChild(this.svgRoot);

    // 3. HTML sublayer for 2D screen-facing label cards
    this.labelsContainer = document.createElement('div');
    this.labelsContainer.className = 'annotation-labels-container';
    this.labelsContainer.style.position = 'absolute';
    this.labelsContainer.style.inset = '0';
    this.labelsContainer.style.pointerEvents = 'none';
    this.overlayRoot.appendChild(this.labelsContainer);

    // 4. Subtle center pivot exploration reticle
    this.centerReticle = document.createElement('div');
    this.centerReticle.className = 'center-pivot-reticle';
    this.centerReticle.title = 'Exploration Pivot (City revolves around this point)';
    this.overlayRoot.appendChild(this.centerReticle);

    this.container.appendChild(this.overlayRoot);

    // Synchronize initial spots
    this.setSpots(spots);
  }

  public setSpots(spots: FoodSpot[]) {
    this.spots = spots;
    const currentIds = new Set(spots.map(s => s.id));

    // Remove nodes that are no longer in spots
    for (const [id, node] of this.nodes.entries()) {
      if (!currentIds.has(id)) {
        if (node.labelEl.parentNode) node.labelEl.parentNode.removeChild(node.labelEl);
        if (node.lineEl.parentNode) node.lineEl.parentNode.removeChild(node.lineEl);
        if (node.dotEl.parentNode) node.dotEl.parentNode.removeChild(node.dotEl);
        this.nodes.delete(id);
      }
    }

    // Add or update nodes
    for (const spot of spots) {
      if (!this.nodes.has(spot.id)) {
        this.createNode(spot);
      } else {
        const node = this.nodes.get(spot.id)!;
        node.spot = spot;
        this.updateNodeContent(node, spot);
        this.updateNodeAnchor(node, spot);
      }
    }
  }

  public getSpots(): FoodSpot[] {
    return this.spots;
  }

  public setSelectedSpot(id: string | null) {
    this.selectedSpotId = id;
    this.nodes.forEach((node, spotId) => {
      const isSelected = spotId === id;
      if (isSelected) {
        node.labelEl.classList.add('selected');
        node.lineEl.classList.add('selected');
        node.dotEl.classList.add('selected');
      } else {
        node.labelEl.classList.remove('selected');
        node.lineEl.classList.remove('selected');
        node.dotEl.classList.remove('selected');
      }
    });
  }

  public setHoveredSpot(id: string | null) {
    this.hoveredSpotId = id;
    this.nodes.forEach((node, spotId) => {
      const isHovered = spotId === id;
      if (isHovered) {
        node.labelEl.classList.add('hovered');
        node.lineEl.classList.add('hovered');
        node.dotEl.classList.add('hovered');
      } else {
        node.labelEl.classList.remove('hovered');
        node.lineEl.classList.remove('hovered');
        node.dotEl.classList.remove('hovered');
      }
    });
  }

  private createNode(spot: FoodSpot): SpotAnnotationNode {
    // 1. Leader Line
    const lineEl = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    lineEl.setAttribute('class', 'annotation-connector-line');
    lineEl.setAttribute('stroke', '#4c6ef5');
    lineEl.setAttribute('stroke-width', '1.25');
    lineEl.setAttribute('stroke-linecap', 'round');
    this.svgRoot.appendChild(lineEl);

    // 2. Anchor Dot
    const dotEl = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dotEl.setAttribute('class', 'annotation-anchor-dot');
    dotEl.setAttribute('r', '3');
    dotEl.setAttribute('fill', '#3b5bdb');
    dotEl.setAttribute('stroke', '#ffffff');
    dotEl.setAttribute('stroke-width', '1');
    this.svgRoot.appendChild(dotEl);

    // 3. 2D Billboard Label Pill
    const labelEl = document.createElement('div');
    labelEl.className = 'spot-billboard-card';
    labelEl.dataset.spotId = spot.id;
    labelEl.style.position = 'absolute';
    labelEl.style.left = '0';
    labelEl.style.top = '0';
    labelEl.style.pointerEvents = 'auto';
    labelEl.style.willChange = 'transform, opacity';

    // Avatar / Icon Monogram
    const avatarEl = document.createElement('span');
    avatarEl.className = 'spot-billboard-avatar';

    // Name
    const nameEl = document.createElement('span');
    nameEl.className = 'spot-billboard-name';

    labelEl.appendChild(avatarEl);
    labelEl.appendChild(nameEl);

    // Bind interaction events directly to label pill
    labelEl.addEventListener('pointerenter', e => {
      this.callbacks.onSpotHover(spot, e);
    });

    labelEl.addEventListener('pointerleave', () => {
      this.callbacks.onSpotHover(null);
    });

    labelEl.addEventListener('click', e => {
      e.stopPropagation();
      this.callbacks.onSpotSelect(spot);
    });

    this.labelsContainer.appendChild(labelEl);

    // Calculate deterministic base stem height to naturally stagger nearby spots
    let hash = 0;
    for (let i = 0; i < spot.id.length; i++) {
      hash = (hash * 31 + spot.id.charCodeAt(i)) | 0;
    }
    const tier = Math.abs(hash) % 3; // 0, 1, or 2
    const baseStemHeight = 2.6 + tier * 0.9;

    const node: SpotAnnotationNode = {
      spot,
      labelEl,
      avatarEl,
      nameEl,
      lineEl,
      dotEl,
      baseStemHeight,
      anchorWorld: new THREE.Vector3(),
      currentScreenPos: { x: 0, y: 0 },
      visible: true,
      isCulled: false
    };

    this.updateNodeAnchor(node, spot);
    this.updateNodeContent(node, spot);
    this.nodes.set(spot.id, node);
    return node;
  }

  private updateNodeAnchor(node: SpotAnnotationNode, spot: FoodSpot) {
    if (spot.locationType === 'existing-building' && spot.buildingId) {
      const bldg = getBuildingById(spot.buildingId);
      if (bldg) {
        // Anchor firmly perched atop existing building rooftop
        node.anchorWorld.set(bldg.x, bldg.h + 0.35, bldg.z);
        node.baseStemHeight = 2.4;
        return;
      }
    }

    // Street / Open space spot
    const [wx, , wz] = latLngToWorld(spot.latitude, spot.longitude);
    node.anchorWorld.set(wx, 1.4, wz);
  }

  private updateNodeContent(node: SpotAnnotationNode, spot: FoodSpot) {
    // 1. Avatar (Monogram or category emoji)
    const initials = spot.name
      .split(' ')
      .map(part => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    let emoji = '🥘';
    if (spot.category === 'Tea & Snacks') emoji = '☕';
    else if (spot.category === 'Tiffin & Dinner') emoji = '🫓';
    else if (spot.category === 'Beverages') emoji = '🧃';
    else if (spot.setupType === 'van') emoji = '🚐';
    else if (spot.setupType === 'cart') emoji = '🛒';

    node.avatarEl.textContent = initials || emoji;
    if (spot.stallColor) {
      node.avatarEl.style.backgroundColor = `${spot.stallColor}22`;
      node.avatarEl.style.color = spot.stallColor;
    }

    // 2. Name only (pure discoverability)
    node.nameEl.textContent = spot.name;
  }

  /**
   * Main per-frame update loop called from Three.js render loop.
   * Performs 3D projection, depth calculation, screen-space collision decluttering,
   * and synchronizes DOM transforms and SVG leader lines with zero latency.
   */
  public update(
    camera: THREE.Camera,
    viewportWidth: number,
    viewportHeight: number,
    zoomLevel: number
  ) {
    if (this.nodes.size === 0) return;

    interface ProjectedCandidate {
      node: SpotAnnotationNode;
      anchorScreen: { x: number; y: number };
      labelScreen: { x: number; y: number };
      dist: number;
      depthNorm: number;
      priority: number;
      width: number;
      height: number;
      scale: number;
      opacity: number;
    }

    const candidates: ProjectedCandidate[] = [];
    const tempVec = new THREE.Vector3();
    const tempTopVec = new THREE.Vector3();

    // 1. Project 3D anchors and top stems to screen space
    for (const node of this.nodes.values()) {
      tempVec.copy(node.anchorWorld);
      tempTopVec.set(
        node.anchorWorld.x,
        node.anchorWorld.y + node.baseStemHeight,
        node.anchorWorld.z
      );

      // Camera distance and normalized depth
      const dist = camera.position.distanceTo(tempVec);
      const depthNorm = Math.min(1, Math.max(0, (dist - 22) / 60));

      // Project anchor
      tempVec.project(camera);
      // Project label top
      tempTopVec.project(camera);

      // Frustum culling check (is point in front of camera?)
      if (tempVec.z > 1.0 || tempTopVec.z > 1.0 || tempVec.z < -1.0) {
        node.labelEl.style.display = 'none';
        node.lineEl.style.display = 'none';
        node.dotEl.style.display = 'none';
        continue;
      }

      // Convert NDC to pixel screen coordinates
      const aX = (tempVec.x * 0.5 + 0.5) * viewportWidth;
      const aY = (-tempVec.y * 0.5 + 0.5) * viewportHeight;
      const tX = (tempTopVec.x * 0.5 + 0.5) * viewportWidth;
      let tY = (-tempTopVec.y * 0.5 + 0.5) * viewportHeight;

      // Ensure minimum screen stem height so label never sits on top of anchor dot
      if (aY - tY < 24) {
        tY = aY - 24;
      }

      // Viewport bounds check with 80px margin
      if (
        tX < -80 ||
        tX > viewportWidth + 80 ||
        tY < -80 ||
        tY > viewportHeight + 80
      ) {
        node.labelEl.style.display = 'none';
        node.lineEl.style.display = 'none';
        node.dotEl.style.display = 'none';
        continue;
      }

      // Depth and Zoom-aware scale & opacity
      const isSelected = node.spot.id === this.selectedSpotId;
      const isHovered = node.spot.id === this.hoveredSpotId;

      // Zoom-based emergence: labels become subtly more prominent as user zooms into neighborhood
      const zoomFactor = THREE.MathUtils.lerp(0.88, 1.08, Math.min(1, Math.max(0, (zoomLevel - 0.45) / 1.5)));
      let scale = (1.04 - 0.22 * depthNorm) * zoomFactor;
      let opacity = 1.0 - 0.22 * depthNorm;

      if (isSelected) {
        scale = 1.12 * zoomFactor;
        opacity = 1.0;
      } else if (isHovered) {
        scale = 1.08 * zoomFactor;
        opacity = 1.0;
      }

      // Estimated bounding box size
      const cardWidth = 125 * scale;
      const cardHeight = 28 * scale;

      // Priority calculation: Selected (10000) > Hovered (5000) > Closer to camera > Community recommended
      let priority = Math.round((1 - depthNorm) * 1000);
      if (isSelected) priority += 10000;
      if (isHovered) priority += 5000;
      if (node.spot.communityRecommended) priority += 50;

      candidates.push({
        node,
        anchorScreen: { x: aX, y: aY },
        labelScreen: { x: tX, y: tY },
        dist,
        depthNorm,
        priority,
        width: cardWidth,
        height: cardHeight,
        scale,
        opacity
      });
    }

    // 2. Sort candidates by descending priority
    candidates.sort((a, b) => b.priority - a.priority);

    // 3. Screen-space decluttering pass
    const acceptedBoxes: BoundingBox[] = [];
    const overlapThreshold = THREE.MathUtils.lerp(0.18, 0.32, Math.min(1, Math.max(0, (zoomLevel - 0.5) / 1.2)));

    for (const cand of candidates) {
      let finalY = cand.labelScreen.y;
      const boxArea = cand.width * cand.height;
      let currentBox: BoundingBox = {
        x1: cand.labelScreen.x - cand.width / 2,
        y1: finalY - cand.height,
        x2: cand.labelScreen.x + cand.width / 2,
        y2: finalY
      };

      let isColliding = false;
      for (const accepted of acceptedBoxes) {
        const overlapX = Math.max(0, Math.min(currentBox.x2, accepted.x2) - Math.max(currentBox.x1, accepted.x1));
        const overlapY = Math.max(0, Math.min(currentBox.y2, accepted.y2) - Math.max(currentBox.y1, accepted.y1));
        const overlapArea = overlapX * overlapY;

        if (overlapArea > overlapThreshold * boxArea) {
          isColliding = true;
          break;
        }
      }

      // If slight collision, attempt vertical shift to resolve
      if (isColliding && cand.node.spot.id !== this.selectedSpotId && cand.node.spot.id !== this.hoveredSpotId) {
        const shiftedY = finalY - 22; // Elevate stem higher
        const shiftedBox: BoundingBox = {
          x1: cand.labelScreen.x - cand.width / 2,
          y1: shiftedY - cand.height,
          x2: cand.labelScreen.x + cand.width / 2,
          y2: shiftedY
        };

        let shiftStillColliding = false;
        for (const accepted of acceptedBoxes) {
          const overlapX = Math.max(0, Math.min(shiftedBox.x2, accepted.x2) - Math.max(shiftedBox.x1, accepted.x1));
          const overlapY = Math.max(0, Math.min(shiftedBox.y2, accepted.y2) - Math.max(shiftedBox.y1, accepted.y1));
          if (overlapX * overlapY > overlapThreshold * boxArea) {
            shiftStillColliding = true;
            break;
          }
        }

        if (!shiftStillColliding) {
          finalY = shiftedY;
          currentBox = shiftedBox;
          isColliding = false;
        }
      }

      const node = cand.node;
      const isSelected = node.spot.id === this.selectedSpotId;
      const isHovered = node.spot.id === this.hoveredSpotId;

      // Ensure selected and hovered spots are never hidden
      const shouldHide = isColliding && !isSelected && !isHovered;

      if (!shouldHide) {
        acceptedBoxes.push(currentBox);
      }

      // 4. Directly update DOM & SVG attributes with zero latency
      node.labelEl.style.display = 'flex';
      node.lineEl.style.display = 'block';
      node.dotEl.style.display = 'block';

      // Update label card position and scale
      node.labelEl.style.transform = `translate3d(${cand.labelScreen.x.toFixed(1)}px, ${finalY.toFixed(1)}px, 0) translate(-50%, -100%) scale(${cand.scale.toFixed(2)})`;
      node.labelEl.style.opacity = shouldHide ? '0' : cand.opacity.toFixed(2);
      node.labelEl.style.pointerEvents = shouldHide ? 'none' : 'auto';
      node.labelEl.style.zIndex = isSelected ? '100' : isHovered ? '90' : `${Math.round(cand.priority / 10)}`;

      // Update connector line
      node.lineEl.setAttribute('x1', cand.anchorScreen.x.toFixed(1));
      node.lineEl.setAttribute('y1', cand.anchorScreen.y.toFixed(1));
      node.lineEl.setAttribute('x2', cand.labelScreen.x.toFixed(1));
      node.lineEl.setAttribute('y2', finalY.toFixed(1));
      node.lineEl.style.opacity = shouldHide ? '0' : Math.min(1, cand.opacity * 0.85).toFixed(2);

      // Update anchor dot
      node.dotEl.setAttribute('cx', cand.anchorScreen.x.toFixed(1));
      node.dotEl.setAttribute('cy', cand.anchorScreen.y.toFixed(1));
      node.dotEl.style.opacity = shouldHide ? '0' : '1';
    }
  }

  public destroy() {
    if (this.overlayRoot.parentNode) {
      this.overlayRoot.parentNode.removeChild(this.overlayRoot);
    }
    this.nodes.clear();
  }
}
