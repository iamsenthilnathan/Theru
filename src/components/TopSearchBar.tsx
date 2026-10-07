import React, { useState, useRef, useEffect } from 'react';
import { Search, X, MapPin, Sparkles, Plus } from 'lucide-react';
import { FoodSpot } from '../types/foodSpot';

interface TopSearchBarProps {
  spots: FoodSpot[];
  onSelectSpot: (spot: FoodSpot) => void;
  selectedSpot: FoodSpot | null;
  onStartAddSpot?: () => void;
}

export const TopSearchBar: React.FC<TopSearchBarProps> = ({
  spots,
  onSelectSpot,
  selectedSpot,
  onStartAddSpot
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredSpots = spots.filter(spot => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      spot.name.toLowerCase().includes(q) ||
      spot.tamilName?.toLowerCase().includes(q) ||
      spot.category.toLowerCase().includes(q) ||
      (spot.specialties && spot.specialties.some(s => s.toLowerCase().includes(q)))
    );
  });

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    window.addEventListener('mousedown', handleOutsideClick);
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSelect = (spot: FoodSpot) => {
    onSelectSpot(spot);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div className="top-search-wrapper" ref={containerRef}>
      <div className="brand-badge">
        <div className="brand-dot" />
        <span className="brand-title">THERU</span>
        <span className="brand-tamil">தெரு</span>
        <span className="brand-subtitle">Street Food Explorer</span>
      </div>

      <div className="search-bar-container">
        <div className="search-input-box">
          <Search size={17} className="search-icon" />
          <input
            type="text"
            placeholder="Search kothu parotta, tea, bajji, shawarma..."
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            className="search-input"
          />
          {query && (
            <button className="clear-btn" onClick={() => setQuery('')} title="Clear search">
              <X size={14} />
            </button>
          )}
        </div>

        {isOpen && (
          <div className="search-dropdown">
            <div className="dropdown-header">
              <span>Local Neighborhood Stalls ({filteredSpots.length})</span>
              <span className="dropdown-hint">Click to fly camera</span>
            </div>

            {filteredSpots.length === 0 ? (
              <div className="dropdown-empty">No street food spot found matching "{query}"</div>
            ) : (
              <div className="dropdown-list">
                {filteredSpots.map(spot => {
                  const isSelected = selectedSpot?.id === spot.id;
                  return (
                    <div
                      key={spot.id}
                      className={`dropdown-item ${isSelected ? 'active' : ''}`}
                      onClick={() => handleSelect(spot)}
                    >
                      <div className="item-color-bar" style={{ backgroundColor: spot.stallColor }} />
                      <div className="item-info">
                        <div className="item-title-row">
                          <span className="item-name">{spot.name}</span>
                          {spot.tamilName && <span className="item-tamil">{spot.tamilName}</span>}
                          {spot.communityRecommended && (
                            <span className="community-badge-pill" title="Community Recommended">
                              <Sparkles size={10} /> Rec
                            </span>
                          )}
                        </div>
                        <div className="item-sub-row">
                          <span className="item-specialty">{spot.specialties[0]}</span>
                          <span className="item-dot">•</span>
                          <span className="item-price">{spot.priceRange}</span>
                          <span className="item-dot">•</span>
                          <span className="item-hours">{spot.openingHours}</span>
                        </div>
                      </div>
                      <div className="fly-icon-badge" title="Focus in 3D">
                        <MapPin size={14} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {onStartAddSpot && (
        <button
          className="add-food-spot-btn"
          onClick={onStartAddSpot}
          title="Add a new street food spot to Theru"
        >
          <Plus size={15} />
          <span>Add food spot</span>
        </button>
      )}
    </div>
  );
};
