/**
 * Esmalt'up Design System Tokens
 * 
 * Color palette, spacing, shadows, and effects for the premium glass/blur/LED redesign.
 * All tokens respect the dark theme with pink accent (#e8a0b4-ish) brand identity.
 */

// ============================================
// COLOR TOKENS
// ============================================

export const colors = {
  // Brand colors (pink accent spectrum)
  pink: {
    50: '#fef7f8',
    100: '#fdf0f2',
    200: '#fad0e6',  // rosa-claro
    300: '#f3b6c7',
    400: '#e8a0b4',  // Primary accent (original #e8a0b4)
    500: '#d67a94',  // rosa-medio
    600: '#c95a73',  // rose-gold
    700: '#b83d52',
    800: '#9f2d40',
    900: '#8a1d31',
    950: '#4d0c1a',
  },
  
  // Semantic colors
  background: {
    primary: 'rgb(var(--bege-claro))',
    secondary: 'rgb(var(--branco))',
    tertiary: 'rgba(255, 255, 255, 0.05)',
  },
  
  foreground: {
    primary: 'rgb(var(--foreground))',
    secondary: 'rgba(var(--foreground-rgb), 0.85)',
    tertiary: 'rgba(var(--foreground-rgb), 0.7)',
    muted: 'rgba(var(--foreground-rgb), 0.5)',
  },
  
  // Glass/blur colors
  glass: {
    background: 'rgba(255, 255, 255, 0.08)',
    border: 'rgba(255, 255, 255, 0.1)',
    highlight: 'rgba(255, 255, 255, 0.15)',
  },
  
  // LED gradient colors
  led: {
    pink: '#e8a0b4',
    rose: '#d67a94',
    violet: '#b83d52',
    softViolet: '#9f2d40',
    // Gradient string for conic-gradient
    ring: 'conic-gradient(from 0deg, #e8a0b4, #d67a94, #b83d52, #9f2d40, #e8a0b4)',
  },
  
  // Status colors
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
};

// ============================================
// SPACING TOKENS
// ============================================

export const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',   // 8px
  md: '1rem',     // 16px
  lg: '1.5rem',   // 24px
  xl: '2rem',     // 32px
  '2xl': '3rem',   // 48px
  '3xl': '4rem',   // 64px
  '4xl': '6rem',   // 96px
};

// ============================================
// BORDER RADIUS TOKENS
// ============================================

export const radius = {
  sm: '0.375rem',    // 6px
  md: '0.5rem',     // 8px
  lg: '0.75rem',    // 12px
  xl: '1rem',       // 16px
  '2xl': '1.5rem',   // 24px
  '3xl': '2rem',     // 32px
  full: '9999px',
};

// ============================================
// SHADOW TOKENS
// ============================================

export const shadows = {
  // Glass card shadows
  glass: {
    inner: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
    tight: '0 1px 2px rgba(201, 137, 145, 0.15)',
    medium: '0 2px 4px rgba(201, 137, 145, 0.15), 0 8px 24px rgba(229, 153, 168, 0.2)',
    large: '0 4px 8px rgba(201, 137, 145, 0.2), 0 16px 40px rgba(229, 153, 168, 0.3)',
    // Pink glow for LED effect
    pinkGlow: '0 0 20px rgba(232, 160, 180, 0.35), 0 0 40px rgba(232, 160, 180, 0.2)',
    pinkGlowStrong: '0 0 30px rgba(232, 160, 180, 0.5), 0 0 60px rgba(232, 160, 180, 0.3)',
  },
  
  // Ambient orb shadows
  orb: {
    small: '0 0 40px rgba(229, 153, 168, 0.2)',
    medium: '0 0 60px rgba(229, 153, 168, 0.15)',
    large: '0 0 80px rgba(229, 153, 168, 0.1)',
  },
};

// ============================================
// BLUR TOKENS
// ============================================

export const blur = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '24px',
  '3xl': '32px',
  // For backdrop-filter
  backdrop: {
    sm: 'blur(4px)',
    md: 'blur(8px)',
    lg: 'blur(12px)',
    xl: 'blur(16px)',
    '2xl': 'blur(24px)',
    saturate: 'saturate(140%)',
  },
};

// ============================================
// TRANSITION TOKENS
// ============================================

export const transitions = {
  fast: '150ms',
  normal: '200ms',
  slow: '300ms',
  slower: '400ms',
  spring: {
    // For Framer Motion
    default: { type: 'spring', stiffness: 250, damping: 30, mass: 0.95 } as const,
    gentle: { type: 'spring', stiffness: 200, damping: 25, mass: 1 } as const,
    snappy: { type: 'spring', stiffness: 300, damping: 25, mass: 0.9 } as const,
  },
  ease: {
    inOut: 'ease-in-out',
    out: 'ease-out',
    in: 'ease-in',
    // Custom cubic-bezier for premium feel
    premium: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

// ============================================
// TYPOGRAPHY TOKENS
// ============================================

export const typography = {
  font: {
    family: {
      sans: 'var(--font-poppins), ui-rounded, "Segoe UI", system-ui, sans-serif',
      display: 'var(--font-poppins), ui-rounded, "Segoe UI", system-ui, sans-serif',
    },
    size: {
      xs: '0.75rem',   // 12px
      sm: '0.875rem',  // 14px
      base: '1rem',    // 16px
      lg: '1.125rem',  // 18px
      xl: '1.25rem',   // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '2rem',    // 32px
      '4xl': '2.5rem',  // 40px
      '5xl': '3rem',    // 48px
      '6xl': '3.75rem', // 60px
      '7xl': '4.5rem',  // 72px
    },
    weight: {
      normal: 400,
      medium: 500,
      semiBold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.1,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
};

// ============================================
// Z-INDEX SCALE
// ============================================

export const zIndex = {
  backdrop: -1,
  base: 0,
  raised: 10,
  dropdown: 100,
  sticky: 200,
  fixed: 300,
  modalBackdrop: 400,
  modal: 500,
  popup: 600,
  tooltip: 700,
  toast: 800,
  loading: 900,
  max: 9999,
};

// ============================================
// BREAKPOINTS
// ============================================

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// ============================================
// ASPECT RATIOS
// ============================================

export const aspectRatios = {
  square: '1 / 1',
  portrait: '4 / 5',
  landscape: '5 / 4',
  wide: '16 / 9',
  card: '3 / 4',
};

// ============================================
// ANIMATION TIMINGS
// ============================================

export const animation = {
  // Page entrance
  pageEntrance: {
    duration: 0.5,
    delay: 0.1,
    stagger: 0.06,
  },
  
  // Hover effects
  hover: {
    scale: 1.02,
    lift: -6,
    duration: 0.2,
  },
  
  // LED sweep
  ledSweep: {
    duration: 2.6,
    repeatDelay: 3.2,
  },
  
  // Autoplay
  autoplay: {
    interval: 6000, // 6 seconds
    transition: 700, // 700ms
  },
  
  // Scroll progress
  scroll: {
    threshold: 0.2,
    margin: '-80px',
  },
};

// ============================================
// EXPORT COMMON STYLES
// ============================================

export const glassCardStyle = {
  background: colors.glass.background,
  backdropFilter: `${blur.backdrop.xl} ${blur.backdrop.saturate}`,
  border: `1px solid ${colors.glass.border}`,
  borderRadius: radius['2xl'],
  boxShadow: shadows.glass.medium,
  position: 'relative' as const,
  overflow: 'hidden' as const,
};

export const ledRingStyle = {
  background: colors.led.ring,
  mask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)' as const,
  maskComposite: 'exclude' as const,
  borderRadius: radius.full,
  padding: '1px',
  position: 'relative' as const,
};

export const neonGlowStyle = {
  boxShadow: shadows.glass.pinkGlow,
  transition: 'box-shadow 0.3s ease',
};

// RGB values for CSS variables
// These match the existing theme variables in globals.css
export const rgbValues = {
  'bege-claro': { r: 23, g: 16, b: 20 },
  'branco': { r: 35, g: 26, b: 31 },
  'rosa-claro': { r: 45, g: 34, b: 40 },
  'rosa-medio': { r: 174, g: 118, b: 132 },
  'rosa-blush': { r: 224, g: 156, b: 170 },
  'rose-gold': { r: 211, g: 150, b: 160 },
  'cinza-suave': { r: 60, g: 48, b: 54 },
  'foreground': { r: 247, g: 241, b: 243 },
};
