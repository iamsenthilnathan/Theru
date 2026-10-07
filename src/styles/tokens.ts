/**
 * Theru Design System Tokens (TypeScript Layer)
 * Synchronized with src/styles/tokens.css for use across 3D canvas and components.
 */

export const THERU_TOKENS = {
  color: {
    bg: {
      day: '#dce7f0',
      dusk: '#c9d5e3',
      night: '#131720'
    },
    surface: {
      default: 'rgba(255, 255, 255, 0.92)',
      solid: '#ffffff',
      elevated: 'rgba(255, 255, 255, 0.96)',
      card: '#f8f9fa'
    },
    text: {
      primary: '#1a1a1a',
      body: '#212529',
      secondary: '#495057',
      muted: '#868e96',
      subtle: '#adb5bd',
      inverse: '#ffffff'
    },
    interactive: {
      default: '#d9480f',
      hover: '#c92a2a',
      active: '#b02a37',
      brandRed: '#e03131',
      brandRedLight: '#ffe3e3'
    },
    feedback: {
      focus: '#1c7ed6',
      success: '#2b8a3e',
      warning: '#f59f00',
      error: '#e03131'
    },
    map: {
      buildingHover: '#ffa94d',
      buildingSelected: '#e03131',
      placementValid: '#2b8a3e',
      placementInvalid: '#e03131'
    },
    foodSpot: {
      stall: '#0ca678',
      cart: '#f59f00',
      van: '#7048e8',
      shop: '#1971c2',
      scooter: '#e03131'
    }
  },
  spacing: {
    '3xs': 2,
    '2xs': 4,
    xs: 6,
    sm: 8,
    md: 12,
    base: 14,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    '4xl': 40
  },
  radius: {
    '2xs': 3,
    xs: 6,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    full: 9999
  },
  elevation: {
    sm: '0 2px 8px rgba(0, 0, 0, 0.06)',
    md: '0 4px 16px rgba(0, 0, 0, 0.08)',
    lg: '0 10px 30px rgba(0, 0, 0, 0.14)',
    xl: '0 16px 44px rgba(0, 0, 0, 0.16)'
  },
  motion: {
    fast: '0.15s ease',
    base: '0.25s cubic-bezier(0.16, 1, 0.3, 1)',
    slow: '0.4s cubic-bezier(0.16, 1, 0.3, 1)'
  },
  zIndex: {
    canvas: 1,
    billboardLine: 5,
    billboardCard: 10,
    hint: 15,
    controls: 20,
    panel: 30,
    hud: 35,
    modalBackdrop: 40,
    modal: 50,
    toast: 60
  }
} as const;

export type TheruTokens = typeof THERU_TOKENS;
