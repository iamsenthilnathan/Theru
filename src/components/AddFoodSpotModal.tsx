import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  MapPin,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Sparkles,
  ShoppingBag,
  Truck,
  Bike,
  Store,
  Tent,
  MoreHorizontal,
  Plus
} from 'lucide-react';
import { FoodSpot, SetupType, LocationType } from '../types/foodSpot';
import { DuplicateAssessment } from '../services/geoService';
import { foodSpotService } from '../services/foodSpotService';
import { BuildingDef } from '../world/neighborhoodBuilder';

const CATEGORIES = [
  'Tiffin & Dinner',
  'Tea & Snacks',
  'Street Eats',
  'Beverages'
];

interface SetupOption {
  id: SetupType;
  label: string;
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
}

const SETUP_OPTIONS: SetupOption[] = [
  { id: 'cart', label: 'Cart / Pushcart', icon: ShoppingBag },
  { id: 'van', label: 'Van / Food Truck', icon: Truck },
  { id: 'scooter', label: 'Scooter / Bike', icon: Bike },
  { id: 'shop', label: 'Small Shop', icon: Store },
  { id: 'stall', label: 'Roadside Stall', icon: Tent },
  { id: 'other', label: 'Other', icon: MoreHorizontal }
];

interface AddFoodSpotModalProps {
  location: { latitude: number; longitude: number; worldPos: [number, number, number] };
  locationType: LocationType;
  selectedBuilding?: BuildingDef | null;
  roadName?: string;
  onClose: () => void;
  onReposition: () => void;
  onCreateSpot: (spotData: {
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
  }) => Promise<void>;
  onOpenExistingSpot: (spot: FoodSpot) => void;
}

export const AddFoodSpotModal: React.FC<AddFoodSpotModalProps> = ({
  location,
  locationType,
  selectedBuilding,
  roadName,
  onClose,
  onReposition,
  onCreateSpot,
  onOpenExistingSpot
}) => {
  const [name, setName] = useState('');
  const [officialName, setOfficialName] = useState('');
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [setupType, setSetupType] = useState<SetupType | undefined>(undefined);
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [streetName, setStreetName] = useState(roadName || 'Bazaar Street');
  const [description, setDescription] = useState('');
  const [signatureDish, setSignatureDish] = useState('');
  const [initialRecommendation, setInitialRecommendation] = useState('');
  const [userConfirmedDifferent, setUserConfirmedDifferent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (roadName) {
      setStreetName(roadName);
    }
  }, [roadName]);

  // Duplicate assessment state
  const [assessment, setAssessment] = useState<DuplicateAssessment | null>(null);

  // Run duplicate check whenever name, category, or location changes
  useEffect(() => {
    let isCancelled = false;
    foodSpotService
      .checkDuplicate({
        name,
        latitude: location.latitude,
        longitude: location.longitude,
        category,
        buildingId: locationType === 'existing-building' ? selectedBuilding?.id : undefined
      })
      .then(res => {
        if (!isCancelled) {
          setAssessment(res);
          // Reset confirmation if user modifies name
          setUserConfirmedDifferent(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [name, category, location.latitude, location.longitude, locationType, selectedBuilding?.id]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const availableSlots = 3 - photos.length;
    if (availableSlots <= 0) return;

    const selectedFiles = Array.from(files).slice(0, availableSlots);

    selectedFiles.forEach(file => {
      const name = file.name.toLowerCase();
      const isAllowedExt = name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png');
      const isAllowedMime = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/pjpeg';
      // Explicitly allow .jpg, .jpeg, and .png; do not reject .jpg files
      if (!isAllowedExt && !isAllowedMime) return;

      const reader = new FileReader();
      reader.onload = ev => {
        const dataUrl = ev.target?.result;
        if (typeof dataUrl === 'string') {
          setPhotos(prev => {
            if (prev.length >= 3) return prev;
            return [...prev, dataUrl];
          });
        }
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (locationType === 'existing-building' && !selectedBuilding) return;

    // Guard against High confidence duplicate
    if (assessment?.confidence === 'HIGH' && assessment.matchedSpot) return;

    setIsSubmitting(true);
    try {
      const minVal = priceMin.trim() !== '' && !isNaN(Number(priceMin)) ? Number(priceMin) : undefined;
      const maxVal = priceMax.trim() !== '' && !isNaN(Number(priceMax)) ? Number(priceMax) : undefined;

      await onCreateSpot({
        name: name.trim(),
        officialName: officialName.trim() || undefined,
        category: category || undefined,
        latitude: location.latitude,
        longitude: location.longitude,
        description: description.trim() || undefined,
        streetName: streetName.trim() || undefined,
        signatureDish: signatureDish.trim() || undefined,
        initialRecommendation: initialRecommendation.trim() || undefined,
        locationType,
        buildingId: locationType === 'existing-building' ? selectedBuilding?.id : undefined,
        setupType: locationType === 'open-space' ? setupType : undefined,
        priceMin: minVal,
        priceMax: maxVal,
        photos: photos.length > 0 ? photos : undefined
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasValidName = name.trim().length > 0;
  const hasValidLocation = Boolean(
    location &&
    typeof location.latitude === 'number' &&
    !isNaN(location.latitude) &&
    typeof location.longitude === 'number' &&
    !isNaN(location.longitude) &&
    (locationType !== 'existing-building' || Boolean(selectedBuilding))
  );
  const isBlocked = assessment?.confidence === 'HIGH' && Boolean(assessment.matchedSpot);
  const canSubmit = hasValidName && hasValidLocation && !isBlocked && !isSubmitting;

  return (
    <div className="add-spot-overlay">
      <div className="add-spot-modal">
        {/* Modal Header */}
        <div className="add-modal-header">
          <div className="add-modal-title-group">
            <span className="add-modal-badge">Add to Theru</span>
            <h2 className="add-modal-title">New Street Food Spot</h2>
          </div>
          <button className="add-modal-close-btn" onClick={onClose} title="Close modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="add-spot-form">
          {/* Nickname / Local Name (Required) */}
          <div className="form-group">
            <label className="form-label" htmlFor="spot-name">
              Nickname / Local Name <span className="req">*</span>
            </label>
            <input
              id="spot-name"
              type="text"
              className="form-input text-lg"
              placeholder="e.g. Thatha Vandi, Kumar Kadai"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          {/* Official Name (Optional) */}
          <div className="form-group">
            <label className="form-label" htmlFor="spot-official-name">
              Official Name <span className="opt">(Optional)</span>
            </label>
            <input
              id="spot-official-name"
              type="text"
              className="form-input"
              placeholder="Enter the official/business name if there is one"
              value={officialName}
              onChange={e => setOfficialName(e.target.value)}
            />
          </div>

          {/* DUPLICATE DETECTION BANNER & WORKFLOW */}
          {assessment && name.trim().length > 1 && (
            <div className={`duplicate-banner confidence-${assessment.confidence.toLowerCase()}`}>
              {/* HIGH CONFIDENCE: BLOCK CREATION */}
              {assessment.confidence === 'HIGH' && assessment.matchedSpot && (
                <div className="duplicate-alert high">
                  <div className="dup-alert-top">
                    <AlertTriangle size={18} className="dup-icon-high" />
                    <div className="dup-alert-text">
                      <span className="dup-headline">This place may already exist</span>
                      <span className="dup-subtext">
                        A place with a strongly matching name was found {assessment.distanceMeters}m from this location.
                      </span>
                    </div>
                  </div>

                  {/* Existing Place Summary Card */}
                  <div className="existing-place-card">
                    <div className="existing-place-info">
                      <span className="existing-place-name">{assessment.matchedSpot.name}</span>
                      {(assessment.matchedSpot.officialName || assessment.matchedSpot.tamilName) && (
                        <span className="existing-place-tamil">
                          {assessment.matchedSpot.officialName || assessment.matchedSpot.tamilName}
                        </span>
                      )}
                      <div className="existing-place-meta">
                        <span className="existing-place-cat">{assessment.matchedSpot.category}</span>
                        <span className="existing-place-dist">📍 {assessment.distanceMeters}m away</span>
                        <span className="existing-place-recs">
                          ⭐ {assessment.matchedSpot.recommendations.length} recommendations • 💬 {assessment.matchedSpot.communityComments.length} tips
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="dup-open-place-btn"
                      onClick={() => onOpenExistingSpot(assessment.matchedSpot!)}
                    >
                      <ExternalLink size={14} />
                      <span>Open existing place</span>
                    </button>
                  </div>

                  <p className="dup-guidance-note">
                    To keep Theru clean and community-driven, duplicate POIs are blocked. Please contribute your recommendations or tips directly to the existing place!
                  </p>
                </div>
              )}

              {/* MEDIUM CONFIDENCE: ASK USER TO CONFIRM */}
              {assessment.confidence === 'MEDIUM' && assessment.matchedSpot && (
                <div className="duplicate-alert medium">
                  <div className="dup-alert-top">
                    <AlertCircle size={18} className="dup-icon-med" />
                    <div className="dup-alert-text">
                      <span className="dup-headline">Possible existing place nearby</span>
                      <span className="dup-subtext">
                        Found "{assessment.matchedSpot.name}" {assessment.distanceMeters}m away. Is this the same stall?
                      </span>
                    </div>
                  </div>

                  <div className="existing-place-card">
                    <div className="existing-place-info">
                      <span className="existing-place-name">{assessment.matchedSpot.name}</span>
                      <div className="existing-place-meta">
                        <span className="existing-place-cat">{assessment.matchedSpot.category}</span>
                        <span className="existing-place-dist">📍 {assessment.distanceMeters}m away</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="dup-open-place-btn secondary"
                      onClick={() => onOpenExistingSpot(assessment.matchedSpot!)}
                    >
                      <ExternalLink size={14} />
                      <span>Open place</span>
                    </button>
                  </div>

                  <div className="confirm-different-row">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={userConfirmedDifferent}
                        onChange={e => setUserConfirmedDifferent(e.target.checked)}
                      />
                      <span>This is a distinct, different food stall from the one above</span>
                    </label>
                  </div>
                </div>
              )}

              {/* LOW CONFIDENCE: CLEAN PASS / DIFFERENT STALLS COEXIST */}
              {assessment.confidence === 'LOW' && (
                <div className="duplicate-alert low">
                  <CheckCircle size={16} className="dup-icon-low" />
                  <div className="dup-alert-text">
                    <span className="dup-headline-low">Ready to add!</span>
                    <span className="dup-subtext-low">
                      {assessment.nearbySpots.length > 0
                        ? `Found ${assessment.nearbySpots.length} nearby stall(s) on this street, but names are distinct.`
                        : 'No conflicting places detected nearby.'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* LOCATION SECTION (Pre-determined by map placement) */}
          <div className="form-group location-group">
            <div className="location-header-row">
              <label className="form-label">Location</label>
              <button
                type="button"
                className="btn-reposition"
                onClick={onReposition}
                title="Change location on map"
              >
                <MapPin size={12} />
                <span>Change location</span>
              </button>
            </div>

            {locationType === 'existing-building' ? (
              <div className="attached-building-card">
                <div className="attached-building-icon-wrap">
                  <Store size={18} />
                </div>
                <div className="attached-building-info">
                  <span className="attached-building-title">
                    {selectedBuilding?.name || `Building ${selectedBuilding?.id || ''}`}
                  </span>
                  <span className="attached-building-sub">
                    Existing building • {selectedBuilding?.type.toUpperCase()}
                  </span>
                </div>
              </div>
            ) : (
              <div className="open-space-location-card">
                <div className="open-space-badge">
                  <span className="location-type-pill">Roadside / Open Space</span>
                  <span className="location-street-label">{streetName || roadName || 'Bazaar Street'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Conditional: Street Setup choices only for Open Space */}
          {locationType === 'open-space' && (
            <div className="form-group">
              <label className="form-label">
                Setup Type <span className="opt">(Optional)</span>
              </label>
              <span className="form-helper-text">Choose what the food setup looks like.</span>
              <div className="setup-chips-row" role="radiogroup" aria-label="Physical setup type">
                {SETUP_OPTIONS.map(opt => {
                  const IconComponent = opt.icon;
                  const isSelected = setupType === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      className={`setup-chip-btn ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSetupType(isSelected ? undefined : opt.id)}
                    >
                      <IconComponent size={14} />
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Category Picker (Optional) */}
          <div className="form-group">
            <label className="form-label">
              Category <span className="opt">(Optional)</span>
            </label>
            <div className="category-chips-grid">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  className={`cat-chip-btn ${category === cat ? 'selected' : ''}`}
                  onClick={() => setCategory(category === cat ? undefined : cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Photos (Optional) */}
          <div className="form-group">
            <label className="form-label">
              Photos <span className="opt">(Optional)</span>
            </label>
            <span className="form-helper-text">
              Add a photo of the storefront or food setup so people can recognize the place.
            </span>

            <input
              type="file"
              ref={fileInputRef}
              accept=".jpg,.jpeg,.png,image/jpeg,image/png"
              multiple
              style={{ display: 'none' }}
              onChange={handlePhotoSelect}
            />

            <div className="photo-upload-container">
              {photos.length > 0 && (
                <div className="photo-thumbnails-row">
                  {photos.map((photo, index) => (
                    <div key={index} className="photo-thumb-wrapper">
                      <img src={photo} alt={`Storefront preview ${index + 1}`} className="photo-thumb-img" />
                      <button
                        type="button"
                        className="photo-remove-btn"
                        onClick={() => handleRemovePhoto(index)}
                        title="Remove photo"
                        aria-label={`Remove photo ${index + 1}`}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {photos.length < 3 && (
                <button
                  type="button"
                  className="add-photos-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Plus size={15} />
                  <span>+ Add photos</span>
                  {photos.length > 0 && (
                    <span className="photo-count-hint">({photos.length}/3)</span>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Price Range (Optional) */}
          <div className="form-group">
            <label className="form-label">
              Price Range <span className="opt">(Optional)</span>
            </label>
            <div className="price-range-row">
              <div className="price-range-field">
                <span className="price-prefix">From ₹</span>
                <input
                  type="number"
                  min="0"
                  className="form-input price-input"
                  placeholder="Min"
                  value={priceMin}
                  onChange={e => setPriceMin(e.target.value)}
                />
              </div>
              <div className="price-range-field">
                <span className="price-prefix">To ₹</span>
                <input
                  type="number"
                  min="0"
                  className="form-input price-input"
                  placeholder="Max"
                  value={priceMax}
                  onChange={e => setPriceMax(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Street Name / Area Landmark */}
          <div className="form-group">
            <label className="form-label" htmlFor="street-name">
              Street / Landmark <span className="opt">(Optional)</span>
            </label>
            <input
              id="street-name"
              type="text"
              className="form-input"
              placeholder="e.g. West Bazaar Lane, Near Temple Tank"
              value={streetName}
              onChange={e => setStreetName(e.target.value)}
            />
          </div>

          {/* Signature Dish / Must-Try */}
          <div className="form-group">
            <label className="form-label" htmlFor="signature-dish">
              Must-Try Dish <span className="opt">(Optional)</span>
            </label>
            <input
              id="signature-dish"
              type="text"
              className="form-input"
              placeholder="e.g. Special Egg Kothu, Dahi Puri, Ginger Tea"
              value={signatureDish}
              onChange={e => setSignatureDish(e.target.value)}
            />
          </div>

          {/* Initial Recommendation / Local Tip */}
          <div className="form-group">
            <label className="form-label" htmlFor="initial-tip">
              Your First Tip or Recommendation <span className="opt">(Optional)</span>
            </label>
            <textarea
              id="initial-tip"
              className="form-textarea"
              rows={2}
              placeholder="e.g. Best after 7 PM. Uncle serves hot salna with extra curry leaves."
              value={initialRecommendation}
              onChange={e => setInitialRecommendation(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label" htmlFor="spot-desc">
              Description <span className="opt">(Optional)</span>
            </label>
            <textarea
              id="spot-desc"
              className="form-textarea"
              rows={2}
              placeholder="Brief description of the ambiance, crowd, or stall setup..."
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          {/* Modal Actions */}
          <div className="add-modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn-create"
              disabled={!canSubmit}
              title={
                isBlocked
                  ? 'Duplicate detected. Please contribute to the existing place.'
                  : !hasValidName
                  ? 'Please enter a name for the food spot'
                  : !hasValidLocation
                  ? 'Please select a valid map location'
                  : 'Add this food spot to Theru'
              }
            >
              <Sparkles size={16} />
              <span>{isSubmitting ? 'Adding Spot...' : 'Create Food Spot'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
