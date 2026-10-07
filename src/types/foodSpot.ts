export interface StructuredRecommendation {
  id: string;
  foodSpotId: string;
  dishName: string;
  description: string;
  recommendCount: number;
  userAgreed?: boolean;
}

export interface CommunityComment {
  id: string;
  foodSpotId: string;
  authorName: string;
  avatarColor: string;
  timeAgo: string;
  text: string;
  likes: number;
  userLiked?: boolean;
  replies?: CommunityComment[];
}

export type LocationType = 'open-space' | 'existing-building';

export type SetupType =
  | 'cart'
  | 'van'
  | 'scooter'
  | 'shop'
  | 'stall'
  | 'other';

/**
 * Pure Geographic FoodSpot POI Entity.
 *
 * This is the canonical geographic data model for Theru.
 * It is completely decoupled from Three.js scene coordinates and procedural 3D geometries,
 * allowing it to be directly backed by PostGIS / Supabase in the future.
 */
export interface FoodSpot {
  id: string;
  name: string;
  officialName?: string;
  tamilName?: string;
  latitude: number;
  longitude: number;
  category: string;
  description: string;
  photos?: string[];
  createdBy: string;
  createdAt: string;

  // Physical placement representation
  locationType?: LocationType;
  buildingId?: string;
  setupType?: SetupType;

  // Real-world contextual metadata
  streetName?: string;
  specialties: string[];
  priceRange?: string;
  priceMin?: number;
  priceMax?: number;
  openingHours: string;
  communityRecommended?: boolean;
  recommendedItem?: string;
  image?: string;

  // Optional presentation hints (used by visual renderers if present)
  stallColor?: string;
  stallType?: string;

  // Community Knowledge (Relational POI layer)
  recommendations: StructuredRecommendation[];
  communityComments: CommunityComment[];
}
