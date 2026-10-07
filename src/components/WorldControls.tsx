import React from 'react';
import {
  Plus,
  Minus,
  Navigation,
  Sunset,
  Moon,
  Sun
} from 'lucide-react';
import { LightingMode } from '../world/WorldScene';

export type TimePeriod = 'dawn' | 'day' | 'evening' | 'night';

export interface LocalTimeInfo {
  timeZone: string;
  hour: number;
  minute: number;
  period: TimePeriod;
  lightingMode: LightingMode;
}

/**
 * Calculates current time of day lighting mode based on user's local time zone & clock.
 * Periods:
 * - 05:00–07:00 = Dawn (dusk lighting)
 * - 07:00–17:00 = Day (day lighting)
 * - 17:00–19:00 = Evening (dusk lighting)
 * - 19:00–05:00 = Night (night lighting, handling midnight 00:00 smoothly)
 */
export function getLocalLightingMode(date: Date = new Date()): LocalTimeInfo {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  let hour = date.getHours();
  let minute = date.getMinutes();

  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: 'numeric',
      minute: 'numeric',
      hour12: false
    }).formatToParts(date);

    for (const part of parts) {
      if (part.type === 'hour') {
        const val = parseInt(part.value, 10);
        hour = isNaN(val) ? hour : val;
      }
      if (part.type === 'minute') {
        const val = parseInt(part.value, 10);
        minute = isNaN(val) ? minute : val;
      }
    }
  } catch {
    // Fallback to Date methods if Intl formatting is unsupported
    hour = date.getHours();
    minute = date.getMinutes();
  }

  // Handle midnight (24 -> 0)
  if (hour === 24) hour = 0;

  const totalMinutes = hour * 60 + minute;

  let period: TimePeriod;
  let lightingMode: LightingMode;

  if (totalMinutes >= 300 && totalMinutes < 420) {
    // 05:00 - 07:00: Dawn
    period = 'dawn';
    lightingMode = 'dusk';
  } else if (totalMinutes >= 420 && totalMinutes < 1020) {
    // 07:00 - 17:00: Day
    period = 'day';
    lightingMode = 'day';
  } else if (totalMinutes >= 1020 && totalMinutes < 1140) {
    // 17:00 - 19:00: Evening
    period = 'evening';
    lightingMode = 'dusk';
  } else {
    // 19:00 - 05:00: Night (including midnight 00:00)
    period = 'night';
    lightingMode = 'night';
  }

  return {
    timeZone,
    hour,
    minute,
    period,
    lightingMode
  };
}

interface WorldControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetRotation: () => void;
  azimuthDeg?: number;
  lightingMode: LightingMode;
  isAutoLighting?: boolean;
  onToggleLighting: (mode: LightingMode) => void;
  onSelectManualLighting?: (mode: LightingMode) => void;
  onResetAutoLighting?: () => void;
}

export const WorldControls: React.FC<WorldControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onResetRotation,
  azimuthDeg = 45,
  lightingMode,
  isAutoLighting = true,
  onToggleLighting,
  onSelectManualLighting,
  onResetAutoLighting
}) => {
  // Compass needle points towards map North (azimuth 45 deg is the default canonical angle)
  const needleRotation = 45 - azimuthDeg;

  const handleManual = (mode: LightingMode) => {
    if (onSelectManualLighting) {
      onSelectManualLighting(mode);
    } else {
      onToggleLighting(mode);
    }
  };

  return (
    <div className="world-controls-stack">
      {/* Time of day / Atmosphere selector */}
      <div className="control-group lighting-group">
        <button
          type="button"
          className={`icon-btn auto-btn ${isAutoLighting ? 'active' : ''}`}
          onClick={onResetAutoLighting}
          title="Auto: Sync lighting with your local clock"
          aria-label="Auto time of day"
        >
          Auto
        </button>
        <button
          type="button"
          className={`icon-btn ${lightingMode === 'dusk' ? 'active' : ''}`}
          onClick={() => handleManual('dusk')}
          title="Evening / Dusk (Street food prime time)"
          aria-label="Evening lighting"
        >
          <Sunset size={16} />
        </button>
        <button
          type="button"
          className={`icon-btn ${lightingMode === 'night' ? 'active' : ''}`}
          onClick={() => handleManual('night')}
          title="Night Bazaar (Lanterns & Neon)"
          aria-label="Night lighting"
        >
          <Moon size={16} />
        </button>
        <button
          type="button"
          className={`icon-btn ${lightingMode === 'day' ? 'active' : ''}`}
          onClick={() => handleManual('day')}
          title="Daylight"
          aria-label="Day lighting"
        >
          <Sun size={16} />
        </button>
      </div>

      {/* Small Compass / Orientation Control (shows North, click resets orientation to default) */}
      <div className="control-group compass-group">
        <button
          type="button"
          className="icon-btn compass-btn"
          onClick={onResetRotation}
          title={`Orientation: ${azimuthDeg}° (Click to reset to North)`}
          aria-label="Compass - Reset Orientation"
        >
          <Navigation
            size={15}
            className="compass-needle"
            style={{ transform: `rotate(${needleRotation}deg)` }}
          />
        </button>
      </div>

      {/* Visually secondary Zoom +/- controls */}
      <div className="control-group secondary-zoom-group">
        <button type="button" className="icon-btn secondary-zoom-btn" onClick={onZoomIn} title="Zoom In" aria-label="Zoom In">
          <Plus size={15} />
        </button>
        <button type="button" className="icon-btn secondary-zoom-btn" onClick={onZoomOut} title="Zoom Out" aria-label="Zoom Out">
          <Minus size={15} />
        </button>
      </div>
    </div>
  );
};
