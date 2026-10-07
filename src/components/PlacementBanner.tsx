import React from 'react';
import { MapPin, X, Store, AlertCircle } from 'lucide-react';
import { PlacementHoverInfo } from '../world/WorldScene';

export interface PlacementBannerProps {
  hoverInfo?: PlacementHoverInfo | null;
  onCancel: () => void;
}

export const PlacementBanner: React.FC<PlacementBannerProps> = ({ hoverInfo, onCancel }) => {
  let title = 'Choose Location on Map';
  let subtitle = 'Click an existing building or anywhere along a street curb';
  let icon = <MapPin size={18} className="placement-pin-pulse" />;
  let bannerClass = 'banner-default';

  if (hoverInfo) {
    if (hoverInfo.targetType === 'existing-building') {
      const bldgLabel = hoverInfo.building?.name || 'Building';
      title = `Attach to ${bldgLabel}`;
      subtitle = 'Click building to attach this food spot';
      icon = <Store size={18} />;
      bannerClass = 'banner-building';
    } else if (hoverInfo.targetType === 'road-open-space') {
      const roadLabel = hoverInfo.roadName || 'Roadside';
      title = `Place on ${roadLabel}`;
      subtitle = 'Click roadside to place your food spot facing the street';
      icon = <MapPin size={18} />;
      bannerClass = 'banner-road';
    } else if (hoverInfo.targetType === 'invalid') {
      title = 'Cannot place here';
      subtitle = 'Move pointer near a road or building';
      icon = <AlertCircle size={18} />;
      bannerClass = 'banner-invalid';
    }
  }

  return (
    <div className={`placement-banner-container ${bannerClass}`}>
      <div className="placement-banner-content">
        <div className="placement-icon-bubble">
          {icon}
        </div>
        <div className="placement-text-group">
          <span className="placement-title">{title}</span>
          <span className="placement-subtitle">{subtitle}</span>
        </div>
        <button className="placement-cancel-btn" onClick={onCancel} title="Exit placement mode">
          <X size={15} />
          <span>Cancel</span>
        </button>
      </div>
    </div>
  );
};
