"use client";

import { motion, useReducedMotion } from "framer-motion";
import { forwardRef } from "react";
import { colors, transitions } from "./tokens";

/**
 * LED Effects Component
 * 
 * Provides various LED-style visual effects:
 * - Animated LED border (rotating conic-gradient)
 * - Neon glow on hover
 * - LED underline for active nav items and titles
 * - Light sweep effect across cards
 */

// ============================================
// LED BORDER
// ============================================

interface LEDBorderProps {
  className?: string;
  children: React.ReactNode;
  disabled?: boolean;
  onHover?: boolean;
}

export function LEDBorder({ 
  className = "", 
  children, 
  disabled = false,
  onHover = true
}: LEDBorderProps) {
  const reduceMotion = useReducedMotion();
  const shouldAnimate = !reduceMotion && !disabled;

  return (
    <motion.div
      className={`relative ${className}`}
      style={{
        borderRadius: 'inherit',
        overflow: 'hidden',
      }}
    >
      {/* LED Ring */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{
          padding: '1px',
          background: 'conic-gradient(from 0deg, #e8a0b4, #d67a94, #b83d52, #9f2d40, #e8a0b4)',
          mask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
          maskComposite: 'exclude',
          WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          borderRadius: 'inherit',
        }}
        animate={shouldAnimate ? {
          background: [
            'conic-gradient(from 0deg, #e8a0b4, #d67a94, #b83d52, #9f2d40, #e8a0b4)',
            'conic-gradient(from 90deg, #e8a0b4, #d67a94, #b83d52, #9f2d40, #e8a0b4)',
            'conic-gradient(from 180deg, #e8a0b4, #d67a94, #b83d52, #9f2d40, #e8a0b4)',
            'conic-gradient(from 270deg, #e8a0b4, #d67a94, #b83d52, #9f2d40, #e8a0b4)',
            'conic-gradient(from 360deg, #e8a0b4, #d67a94, #b83d52, #9f2d40, #e8a0b4)',
          ],
        } : {}}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {children}
    </motion.div>
  );
}

// ============================================
// NEON GLOW
// ============================================

interface NeonGlowProps {
  className?: string;
  children: React.ReactNode;
  color?: 'pink' | 'rose' | 'violet';
  intensity?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

const glowColors = {
  pink: {
    sm: '0 0 15px rgba(232, 160, 180, 0.3)',
    md: '0 0 25px rgba(232, 160, 180, 0.4)',
    lg: '0 0 35px rgba(232, 160, 180, 0.5)',
  },
  rose: {
    sm: '0 0 15px rgba(214, 122, 148, 0.3)',
    md: '0 0 25px rgba(214, 122, 148, 0.4)',
    lg: '0 0 35px rgba(214, 122, 148, 0.5)',
  },
  violet: {
    sm: '0 0 15px rgba(184, 61, 82, 0.3)',
    md: '0 0 25px rgba(184, 61, 82, 0.4)',
    lg: '0 0 35px rgba(184, 61, 82, 0.5)',
  },
};

export function NeonGlow({
  className = "",
  children,
  color = 'pink',
  intensity = 'md',
  disabled = false,
}: NeonGlowProps) {
  const reduceMotion = useReducedMotion();
  const glow = glowColors[color][intensity];

  return (
    <motion.div
      className={className}
      style={{
        boxShadow: disabled ? 'none' : glow,
      }}
      whileHover={!reduceMotion && !disabled ? {
        boxShadow: glowColors[color].lg,
      } : {}}
      transition={{
        duration: 0.3,
        ease: 'ease-in-out',
      }}
    >
      {children}
    </motion.div>
  );
}

// ============================================
// LED UNDERLINE
// ============================================

interface LEDUnderlineProps {
  className?: string;
  active?: boolean;
  color?: 'pink' | 'rose' | 'violet';
  animated?: boolean;
  width?: string;
}

const underlineColors = {
  pink: 'linear-gradient(90deg, #e8a0b4, #d67a94, #b83d52)',
  rose: 'linear-gradient(90deg, #d67a94, #b83d52, #9f2d40)',
  violet: 'linear-gradient(90deg, #b83d52, #9f2d40, #8a1d31)',
};

export function LEDUnderline({
  className = "",
  active = true,
  color = 'pink',
  animated = true,
  width = '100%',
}: LEDUnderlineProps) {
  const reduceMotion = useReducedMotion();
  const shouldAnimate = !reduceMotion && animated && active;

  if (!active) return null;

  return (
    <motion.div
      className={className}
      style={{
        height: '2px',
        width: width,
        background: underlineColors[color],
        borderRadius: '1px',
      }}
      animate={shouldAnimate ? {
        background: [
          underlineColors[color],
          `linear-gradient(90deg, ${colors.led.violet}, ${colors.led.pink}, ${colors.led.rose})`,
          underlineColors[color],
        ],
      } : {}}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'ease-in-out',
      }}
    />
  );
}

// ============================================
// LIGHT SWEEP
// ============================================

interface LightSweepProps {
  className?: string;
  children: React.ReactNode;
  disabled?: boolean;
  direction?: 'left' | 'right' | 'diagonal';
}

export function LightSweep({
  className = "",
  children,
  disabled = false,
  direction = 'diagonal',
}: LightSweepProps) {
  const reduceMotion = useReducedMotion();
  const shouldAnimate = !reduceMotion && !disabled;

  // Create the light sweep overlay
  const getGradient = () => {
    switch (direction) {
      case 'left':
        return 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)';
      case 'right':
        return 'linear-gradient(270deg, transparent, rgba(255,255,255,0.1), transparent)';
      case 'diagonal':
      default:
        return 'linear-gradient(135deg, transparent, rgba(255,255,255,0.15), transparent)';
    }
  };

  return (
    <motion.div
      className={`relative overflow-hidden ${className}`}
    >
      {/* Children */}
      {children}

      {/* Light sweep overlay */}
      {shouldAnimate && (
        <motion.div
          className="pointer-events-none absolute inset-0"
          style={{
            background: getGradient(),
            transform: 'translateX(-100%)',
          }}
          animate={{
            transform: ['translateX(-100%)', 'translateX(200%)'],
          }}
          transition={{
            duration: 2.6,
            repeat: Infinity,
            repeatDelay: 3.2,
            ease: 'easeInOut',
          }}
        />
      )}
    </motion.div>
  );
}

// ============================================
// AMBIENT ORB
// ============================================

interface AmbientOrbProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  color?: 'pink' | 'rose' | 'violet';
  disabled?: boolean;
}

const orbSizes = {
  sm: { width: 'w-40', height: 'h-40' },
  md: { width: 'w-80', height: 'h-80' },
  lg: { width: 'w-96', height: 'h-96' },
};

const orbPositions = {
  'top-left': '-top-24 -left-24',
  'top-right': 'top-1/3 -right-28',
  'bottom-left': 'bottom-0 left-1/4',
  'bottom-right': 'bottom-0 right-1/4',
  center: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
};

const orbColors = {
  pink: 'bg-rosa-medio/30',
  rose: 'bg-rose-gold/20',
  violet: 'bg-rosa-blush/20',
};

const orbBlur = {
  sm: 'blur-2xl',
  md: 'blur-3xl',
  lg: 'blur-3xl',
};

const orbMotion = {
  'top-left': { x: [0, 24, 0], y: [0, 16, 0] },
  'top-right': { x: [0, -20, 0], y: [0, 24, 0] },
  'bottom-left': { x: [0, 16, 0], y: [0, -20, 0] },
  'bottom-right': { x: [0, -24, 0], y: [0, -16, 0] },
  center: { x: [0, 0, 0], y: [0, 0, 0] },
};

export function AmbientOrb({
  className = "",
  size = 'md',
  position = 'top-left',
  color = 'pink',
  disabled = false,
}: AmbientOrbProps) {
  const reduceMotion = useReducedMotion();
  const shouldAnimate = !reduceMotion && !disabled;
  const sizeClass = orbSizes[size];
  const positionClass = orbPositions[position];
  const colorClass = orbColors[color];
  const blurClass = orbBlur[size];
  const motion = orbMotion[position];

  return (
    <motion.div
      aria-hidden
      className={`pointer-events-none absolute ${positionClass} ${sizeClass.width} ${sizeClass.height} rounded-full ${colorClass} ${blurClass} ${className}`}
      animate={shouldAnimate ? motion : {}}
      transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      style={{
        willChange: shouldAnimate ? 'transform' : 'auto',
      }}
    />
  );
}

// ============================================
// PEDESTAL EFFECT (for product images)
// ============================================

interface PedestalProps {
  className?: string;
  children: React.ReactNode;
  disabled?: boolean;
  aspectRatio?: string;
}

export function Pedestal({
  className = "",
  children,
  disabled = false,
  aspectRatio = '1 / 1',
}: PedestalProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={`relative overflow-hidden rounded-2xl ${className}`}
      style={{
        aspectRatio: aspectRatio,
      }}
    >
      {/* Background pedestal */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2), transparent 70%)',
        }}
      />
      
      {/* Inner shadow */}
      <div
        className="absolute inset-0"
        style={{
          boxShadow: 'inset 0 0 30px rgba(0,0,0,0.2)',
          borderRadius: '1.5rem',
        }}
      />
      
      {/* Reflection */}
      <div
        className="absolute inset-x-0 bottom-0 h-1/4"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.3), transparent)',
        }}
      />

      {/* Content */}
      <motion.div
        className="relative h-full w-full"
        whileHover={!reduceMotion && !disabled ? {
          scale: 1.05,
        } : {}}
        transition={{
          type: 'spring',
          stiffness: 200,
          damping: 25,
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

// ============================================
// EXPORTS
// ============================================

export {
  LEDBorder as default,
  NeonGlow,
  LEDUnderline,
  LightSweep,
  AmbientOrb,
  Pedestal,
};
