# Theru (தெரு)

A community-built map for discovering and documenting local street food.

---

## Overview

Popular restaurants are already easy to discover through mainstream delivery platforms such as Swiggy and Zomato. However, smaller local food places—street stalls, carts, tea shops, juice stalls, and neighborhood food spots—are significantly harder to discover digitally.

Theru explores a different approach:

> **"The map is the product. Food is the content. Community knowledge gives each place its identity."**

Instead of reducing locations to isolated search pins on a commercial directory, Theru organizes discovery through a clear spatial hierarchy:

CITY → NEIGHBORHOOD → STREET → FOOD SPOT → COMMUNITY KNOWLEDGE

The long-term goal is to allow people to discover and contribute knowledge about local food places that may otherwise remain invisible online.

---

## Core Product Model

Theru maintains a deliberate conceptual separation across three layers:

- **Real Geography $\rightarrow$ WHERE**: Determines where physical roads, buildings, and spaces exist in the physical world.
- **User / Community $\rightarrow$ WHAT**: Provides the culinary identity, specialties, timings, and informal knowledge associated with each place.
- **Theru $\rightarrow$ HOW IT LOOKS**: Determines the visual presentation, rendering the physical environment as a stylized, readable miniature world.

Real geography determines where a place exists. Users and the community provide the meaning and information associated with that place. Theru controls the visual representation.

This architectural distinction ensures that the physical geography, community-contributed content, and 3D rendering pipeline remain decoupled. The underlying geographic representation can evolve and scale without requiring a rewrite of the core community data model or user interaction layer.

---

## Design Direction

Theru uses a **miniature diorama-style** visual language instead of a conventional GIS or satellite map interface.

The goal is to make neighborhoods feel explorable and tangible rather than simply representing them as abstract coordinates:

- **Geographic Context**: Buildings, streets, and pathways provide physical reference points for every food spot.
- **Spatial Hierarchy**: Environmental elements are visually balanced to prioritize pedestrian paths and activity corridors.
- **Low-Poly Environmental Forms**: Stylized geometry maintains clarity, visual warmth, and fast rendering performance.
- **Building / Street Relationships**: Food spots relate naturally to street frontages, pedestrian corners, and building edges.
- **Readable Annotations**: Interactive map annotations adapt to perspective and distance without cluttering the screen.
- **Restrained Visual Detail**: Focuses on clarity and locality feel rather than photorealistic visual noise.
- **Community-Oriented Interaction**: Direct spatial interaction encourages intuitive exploration and place addition.

*(Note: The current Phase 1 world establishes this visual language and interaction model on a curated prototype environment; it does not yet represent full-scale real-world geographic GIS datasets.)*

---

## Current Status

- **Phase 1 — Stable baseline**: Implemented and verified baseline establishing the core interactive map experience, 3D interaction model, and visual language.
- **Phase 2 / Phase 3 — In development**: Exploring geographically grounded locality representations using real-world open geographic datasets while preserving Theru's miniature diorama aesthetic.

---

## Implemented Capabilities (Phase 1 Baseline)

Phase 1 intentionally establishes the product interaction model and visual language before scaling the geographic representation:

- **Interactive Miniature 3D Map**: Smooth 360° orbit, pan, and zoom camera controls centered around neighborhood street corridors.
- **Stylized Streets and Buildings**: Procedural low-poly buildings, architectural setbacks, and multi-tier road networks.
- **FoodSpot Discovery and Annotations**: Perspective-aware 3D markers indicating vendor types and signature offerings.
- **FoodSpot Detail Experience**: Contextual detail panel presenting food spot details, specialties, operating hours, and community notes.
- **Add FoodSpot Flow**: Modal-driven creation workflow capturing spot details, setup types, and regional specialties.
- **Map-Based FoodSpot Placement**: Interactive placement mode allowing users to position spots directly on the 3D map with live feedback.
- **Building-Aware and Roadside Placement**: Placement detection supporting standalone carts, roadside stalls, and building-attached spots.
- **Camera Orbit, Pan, and Zoom**: Intuitive view navigation with keyboard and pointer controls, including a dynamic orientation compass.
- **Day / Dusk / Night Environment Controls**: Configurable ambient lighting modes reflecting different times of day.
- **Responsive Map Annotations**: World-to-screen projected UI labels that scale and cluster cleanly with camera distance.
- **Community-Oriented FoodSpot Data Model**: Typed data schema covering setup categories (cart, stall, shop), pricing, hours, and user feedback.
- **Modular Three.js World Architecture**: Decoupled systems for scene management, procedural geometry generation, lighting, and annotations.
- **Design Token System**: Centralized design system with consistent color scales, typography tokens, elevation surfaces, and layout constants.

---

## Tech Stack

- **React 18**: UI component hierarchy and interactive overlays
- **TypeScript**: End-to-end type safety for data models, world states, and services
- **Three.js**: 3D scene graph, procedural geometry, lighting, and camera controllers
- **Vite**: Build tooling and rapid development server
- **CSS**: Scoped styling backed by a centralized design token system
- **Lucide React**: Clean iconography for spatial controls and metadata displays

The architecture is designed so the current local data layer can eventually be replaced or expanded with persistent geographic datasets and backend APIs without rewriting the core interaction model.

---

## Project Structure

```text
src/
├── components/   # UI overlays (detail panels, search bar, placement modals, controls, viewports)
├── data/         # Local datasets and mock food spot catalogs
├── services/     # Geospatial calculations, food spot state, and persistence services
├── styles/       # Global CSS styles and design token definitions
├── types/        # TypeScript interfaces for food spots, geography, and world state
└── world/        # Three.js 3D world scene, building procedural builders, annotations, and camera controls

docs/
└── DESIGN_SYSTEM.md # Detailed design system guidelines and visual specifications
```

---

## Running Locally

### Prerequisites

- Node.js (v18 or higher recommended)
- npm (v9 or higher recommended)

### 1. Install Dependencies

```bash
npm install
```

Installs all project dependencies, including React, Three.js, TypeScript, and Vite development tooling.

### 2. Start Development Server

```bash
npm run dev
```

Launches the local Vite development server with Hot Module Replacement (HMR). The terminal will display the local URL (typically `http://localhost:5173`).

### 3. Build for Production

```bash
npm run build
```

Executes TypeScript compilation (`tsc`) and Vite bundling to generate optimized static production assets in the `dist/` directory.

---

## Roadmap

### Phase 1: Stable Baseline
- [x] Core interactive map
- [x] Miniature neighborhood environment
- [x] FoodSpot model
- [x] FoodSpot discovery
- [x] FoodSpot placement
- [x] FoodSpot detail experience
- [x] Design system

### Phase 2 / Phase 3: In Development
- [ ] Real-world geographic locality data
- [ ] Offline geographic preprocessing
- [ ] Scalable static locality datasets
- [ ] Geographic building and road representation
- [ ] Environmental reconstruction
- [ ] Real locality FoodSpot mapping

### Future
- [ ] Community contributions
- [ ] Persistent FoodSpot data
- [ ] Search and discovery
- [ ] Recommendations
- [ ] Moderation and verification
- [ ] Multi-locality support
