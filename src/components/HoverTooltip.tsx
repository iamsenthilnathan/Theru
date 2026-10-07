import React from 'react';
import { FoodSpot } from '../types/foodSpot';

interface HoverTooltipProps {
  spot: FoodSpot | null;
  coords: { x: number; y: number } | null;
}

export const HoverTooltip: React.FC<HoverTooltipProps> = ({ spot, coords }) => {
  if (!spot || !coords) return null;

  return (
    <div
      className="hover-tooltip"
      style={{
        left: `${coords.x + 14}px`,
        top: `${coords.y - 12}px`
      }}
    >
      <div className="tooltip-indicator" style={{ backgroundColor: spot.stallColor }} />
      <div className="tooltip-content">
        <div className="tooltip-title">{spot.name}</div>
        <div className="tooltip-sub">
          <span>{spot.specialties[0]}</span>
          <span className="tooltip-dot">•</span>
          <span className="tooltip-price">{spot.priceRange}</span>
        </div>
      </div>
    </div>
  );
};
