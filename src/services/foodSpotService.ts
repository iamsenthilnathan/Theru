import { FoodSpot, StructuredRecommendation, CommunityComment, SetupType, LocationType } from '../types/foodSpot';
import { MOCK_FOOD_SPOTS } from '../data/mockFoodSpots';
import { assessDuplicate, DuplicateAssessment, DEFAULT_DUPLICATE_RADIUS_METERS, latLngToWorld } from './geoService';

// In-memory mutable store initialized from mock geographic data
let localSpots: FoodSpot[] = JSON.parse(JSON.stringify(MOCK_FOOD_SPOTS));

export interface CreateFoodSpotInput {
  name: string;
  officialName?: string;
  tamilName?: string;
  latitude: number;
  longitude: number;
  category?: string;
  description?: string;
  photos?: string[];
  streetName?: string;
  signatureDish?: string;
  initialRecommendation?: string;
  locationType?: LocationType;
  buildingId?: string;
  setupType?: SetupType;
  priceMin?: number;
  priceMax?: number;
  createdBy?: string;
}

export const foodSpotService = {
  /**
   * Fetch all street food spots
   */
  async getAllSpots(): Promise<FoodSpot[]> {
    return Promise.resolve([...localSpots]);
  },

  /**
   * Fetch spot by unique id
   */
  async getSpotById(id: string): Promise<FoodSpot | undefined> {
    return Promise.resolve(localSpots.find(spot => spot.id === id));
  },

  /**
   * Set or update storefront photos for an existing food spot (max 3 photos)
   */
  async updateSpotPhotos(spotId: string, photos: string[]): Promise<FoodSpot | undefined> {
    const spot = localSpots.find(s => s.id === spotId);
    if (!spot) return undefined;
    spot.photos = photos.slice(0, 3);
    return Promise.resolve({ ...spot });
  },

  /**
   * Search food spots by name, tamil name, category, or specialties
   */
  async searchSpots(query: string): Promise<FoodSpot[]> {
    const q = query.trim().toLowerCase();
    if (!q) return Promise.resolve(localSpots);

    return Promise.resolve(
      localSpots.filter(spot => {
        return (
          spot.name.toLowerCase().includes(q) ||
          spot.tamilName?.toLowerCase().includes(q) ||
          spot.category.toLowerCase().includes(q) ||
          (spot.specialties && spot.specialties.some(s => s.toLowerCase().includes(q))) ||
          spot.recommendations.some(r => r.dishName.toLowerCase().includes(q))
        );
      })
    );
  },

  /**
   * Check for nearby duplicates using geographic proximity + normalized text similarity
   */
  async checkDuplicate(
    candidate: { name: string; latitude: number; longitude: number; category?: string; buildingId?: string },
    radiusMeters: number = DEFAULT_DUPLICATE_RADIUS_METERS
  ): Promise<DuplicateAssessment> {
    return Promise.resolve(assessDuplicate(candidate, localSpots, radiusMeters));
  },

  /**
   * Create a new geographic FoodSpot POI
   */
  async createFoodSpot(input: CreateFoodSpotInput): Promise<FoodSpot> {
    const id = `spot-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toISOString();

    const recommendations: StructuredRecommendation[] = [];
    if (input.signatureDish || input.initialRecommendation) {
      recommendations.push({
        id: `rec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        foodSpotId: id,
        dishName: input.signatureDish?.trim() || 'Signature Special',
        description: input.initialRecommendation?.trim() || 'Recommended by discoverer.',
        recommendCount: 1,
        userAgreed: true
      });
    }

    // Default SVG placeholder image
    const placeholderSvg = `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180" width="320" height="180">
        <rect width="100%" height="100%" fill="#d9480f" rx="16" />
        <text x="160" y="90" font-size="44" text-anchor="middle" dominant-baseline="central">🍲</text>
        <text x="160" y="145" font-family="sans-serif" font-weight="bold" font-size="14" fill="#ffffff" text-anchor="middle">${input.name.toUpperCase()}</text>
      </svg>`
    )}`;

    // Compute formatted priceRange string from priceMin / priceMax
    let priceRange = '₹';
    if (input.priceMin !== undefined && input.priceMax !== undefined) {
      priceRange = `₹${input.priceMin} – ₹${input.priceMax}`;
    } else if (input.priceMin !== undefined) {
      priceRange = `From ₹${input.priceMin}`;
    } else if (input.priceMax !== undefined) {
      priceRange = `Up to ₹${input.priceMax}`;
    }

    const newSpot: FoodSpot = {
      id,
      name: input.name.trim(),
      officialName: input.officialName?.trim(),
      tamilName: input.tamilName?.trim(),
      latitude: input.latitude,
      longitude: input.longitude,
      category: input.category || '',
      description: input.description?.trim() || 'A newly discovered neighborhood street food spot.',
      photos: input.photos && input.photos.length > 0 ? input.photos : undefined,
      image: placeholderSvg,
      createdBy: input.createdBy?.trim() || 'Local Explorer',
      createdAt: now,
      streetName: input.streetName || 'Local Street',
      specialties: input.signatureDish ? [input.signatureDish.trim()] : [],
      priceRange,
      priceMin: input.priceMin,
      priceMax: input.priceMax,
      openingHours: 'Evening / All Day',
      communityRecommended: false,
      recommendedItem: input.signatureDish?.trim() || input.name.trim(),
      stallColor: getCategoryColor(input.category),
      locationType: input.locationType || (input.buildingId ? 'existing-building' : 'open-space'),
      buildingId: input.buildingId,
      setupType: input.locationType === 'existing-building' ? undefined : input.setupType,
      recommendations,
      communityComments: []
    };

    localSpots.push(newSpot);

    const [expectedWx, expectedWy, expectedWz] = latLngToWorld(newSpot.latitude, newSpot.longitude);
    console.log('[LOG C - CREATED]', JSON.stringify({
      id: newSpot.id,
      name: newSpot.name,
      latLng: {
        latitude: Number(newSpot.latitude.toFixed(6)),
        longitude: Number(newSpot.longitude.toFixed(6))
      },
      category: newSpot.category,
      setupType: newSpot.setupType || 'none',
      worldPosition: {
        x: Number(expectedWx.toFixed(4)),
        y: Number(expectedWy.toFixed(4)),
        z: Number(expectedWz.toFixed(4))
      }
    }));

    return Promise.resolve({ ...newSpot });
  },

  /**
   * Toggle agree on a structured dish recommendation
   */
  async agreeRecommendation(spotId: string, recId: string): Promise<FoodSpot | undefined> {
    const spot = localSpots.find(s => s.id === spotId);
    if (!spot) return undefined;

    const rec = spot.recommendations.find(r => r.id === recId);
    if (rec) {
      if (rec.userAgreed) {
        rec.recommendCount = Math.max(0, rec.recommendCount - 1);
        rec.userAgreed = false;
      } else {
        rec.recommendCount += 1;
        rec.userAgreed = true;
      }
    }
    return Promise.resolve({ ...spot });
  },

  /**
   * Add a new structured community dish recommendation
   */
  async addRecommendation(
    spotId: string,
    dishName: string,
    description: string
  ): Promise<FoodSpot | undefined> {
    const spot = localSpots.find(s => s.id === spotId);
    if (!spot) return undefined;

    const newRec: StructuredRecommendation = {
      id: `rec-${Date.now()}`,
      foodSpotId: spotId,
      dishName: dishName.trim(),
      description: description.trim() || 'Recommended by a local explorer.',
      recommendCount: 1,
      userAgreed: true
    };

    spot.recommendations.unshift(newRec);
    return Promise.resolve({ ...spot });
  },

  /**
   * Add a community comment / local tip
   */
  async addComment(spotId: string, text: string, authorName = 'You'): Promise<FoodSpot | undefined> {
    const spot = localSpots.find(s => s.id === spotId);
    if (!spot) return undefined;

    const newComment: CommunityComment = {
      id: `comm-${Date.now()}`,
      foodSpotId: spotId,
      authorName: authorName.trim() || 'You',
      avatarColor: '#d9480f',
      timeAgo: 'just now',
      text: text.trim(),
      likes: 0,
      userLiked: false,
      replies: []
    };

    spot.communityComments.unshift(newComment);
    return Promise.resolve({ ...spot });
  },

  /**
   * Toggle like on a community comment
   */
  async likeComment(spotId: string, commentId: string): Promise<FoodSpot | undefined> {
    const spot = localSpots.find(s => s.id === spotId);
    if (!spot) return undefined;

    const comment = spot.communityComments.find(c => c.id === commentId);
    if (comment) {
      if (comment.userLiked) {
        comment.likes = Math.max(0, comment.likes - 1);
        comment.userLiked = false;
      } else {
        comment.likes += 1;
        comment.userLiked = true;
      }
    }
    return Promise.resolve({ ...spot });
  },

  /**
   * Add a reply to a community comment
   */
  async addReply(
    spotId: string,
    commentId: string,
    text: string,
    authorName = 'You'
  ): Promise<FoodSpot | undefined> {
    const spot = localSpots.find(s => s.id === spotId);
    if (!spot) return undefined;

    const comment = spot.communityComments.find(c => c.id === commentId);
    if (comment) {
      if (!comment.replies) comment.replies = [];
      comment.replies.push({
        id: `rep-${Date.now()}`,
        foodSpotId: spotId,
        authorName: authorName.trim() || 'You',
        avatarColor: '#495057',
        timeAgo: 'just now',
        text: text.trim(),
        likes: 0
      });
    }
    return Promise.resolve({ ...spot });
  }
};

function getCategoryColor(category?: string): string {
  if (!category) return '#2b8a3e';
  switch (category) {
    case 'Tiffin & Dinner':
      return '#e03131';
    case 'Tea & Snacks':
      return '#fab005';
    case 'Street Eats':
      return '#fd7e14';
    case 'Beverages':
      return '#0ca678';
    default:
      return '#2b8a3e';
  }
}
