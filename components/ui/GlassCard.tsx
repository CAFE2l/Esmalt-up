"use client";

import { m, useReducedMotion } from "framer-motion";
import { forwardRef } from "react";
import { glassCardStyle, shadows } from "./tokens";

/**
 * GlassCard - A premium glass-morphism card component with blur, border, and shadow effects.
 * 
 * Features:
 * - Semi-transparent background (white/5-8%)
 * - backdrop-filter blur (16-24px) with saturate(140%)
 * - 1px border with white/10 opacity
 * - Inner top highlight (inset shadow)
 * - Layered soft shadows (tight dark + wide pink glow)
 * - Optional LED border effect
 * - Hover animations (lift, scale, glow intensify)
 * - Respects prefers-reduced-motion
 */

type NativeDragProps =
  | 'onDrag'
  | 'onDragStart'
  | 'onDragEnd'
  | 'onDragEnter'
  | 'onDragLeave'
  | 'onDragOver'
  | 'onDragExit'
  | 'onDrop'
  | 'onAnimationStart'
  | 'onAnimationEnd'
  | 'onAnimationIteration'
  | 'onTransitionEnd';

interface GlassCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, NativeDragProps> {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  withLed?: boolean;
  ledColor?: 'pink' | 'rose' | 'violet';
  borderRadius?: '2xl' | '3xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

const borderRadiusMap = {
  '2xl': '1.5rem',
  '3xl': '2rem',
  full: '9999px',
};

const paddingMap = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};


const ledGlowMap = {
  pink: '0 0 25px rgba(232, 160, 180, 0.4), 0 0 50px rgba(232, 160, 180, 0.2)',
  rose: '0 0 25px rgba(214, 122, 148, 0.4), 0 0 50px rgba(214, 122, 148, 0.2)',
  violet: '0 0 25px rgba(184, 61, 82, 0.4), 0 0 50px rgba(184, 61, 82, 0.2)',
};

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  (
    {
      children,
      className = "",
      hoverable = false,
      withLed = false,
      ledColor = 'pink',
      borderRadius = '2xl',
      padding = 'md',
      onClick,
      ...props
    },
    ref
  ) => {
    const reduceMotion = useReducedMotion();
    const isHoverable = hoverable && !reduceMotion;
    const br = borderRadiusMap[borderRadius];
    const pad = paddingMap[padding];
    const ledGlowValue = ledGlowMap[ledColor];

    const baseStyle = {
      ...glassCardStyle,
      borderRadius: br,
    };

    // Fallback for browsers without backdrop-filter
    const hasBackdropFilter =
      typeof window !== "undefined" &&
      "backdropFilter" in document.body.style;

    return (
      <m.div
        ref={ref}
        className={`relative ${pad} ${className}`}
        style={baseStyle}
        onClick={onClick}
        {...props}
      >
        {/* Inner highlight (top inset shadow) */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            borderRadius: br,
            boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
          }}
        />

        {/* Optional LED border effect */}
        {withLed && (
          <m.div
            className="pointer-events-none absolute inset-0"
            style={{
              borderRadius: br,
              padding: '1px',
              background: 'conic-gradient(from 0deg, #e8a0b4, #d67a94, #b83d52, #9f2d40, #e8a0b4)',
              mask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
              maskComposite: 'exclude',
              WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
            }}
            animate={reduceMotion ? {} : {
              background: [
                'conic-gradient(from 0deg, #e8a0b4, #d67a94, #b83d52, #9f2d40, #e8a0b4)',
                'conic-gradient(from 90deg, #e8a0b4, #d67a94, #b83d52, #9f2d40, #e8a0b4)',
                'conic-gradient(from 180deg, #e8a0b4, #d67a94, #b83d52, #9f2d40, #e8a0b4)',
                'conic-gradient(from 270deg, #e8a0b4, #d67a94, #b83d52, #9f2d40, #e8a0b4)',
                'conic-gradient(from 360deg, #e8a0b4, #d67a94, #b83d52, #9f2d40, #e8a0b4)',
              ],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        )}

        {/* Content */}
        <m.div
          className="relative z-10 h-full w-full"
          style={{
            borderRadius: br,
          }}
        >
          {children}
        </m.div>

        {/* Hover effects */}
        {isHoverable && (
          <m.div
            className="pointer-events-none absolute inset-0"
            style={{
              borderRadius: br,
              boxShadow: shadows.glass.pinkGlow,
            }}
            whileHover={{
              boxShadow: ledGlowValue,
              scale: 1.02,
              y: -4,
            }}
            transition={{
              type: 'spring',
              stiffness: 250,
              damping: 30,
            }}
          />
        )}

        {/*
          Backdrop-filter fallback used to be gated on a `typeof window` check
          performed during render, which produced different markup on the server
          and the client and broke hydration. `glassCardStyle` already supplies
          an equivalent translucent background + border, so no extra node is
          needed here.
        */}
      </m.div>
    );
  }
);

GlassCard.displayName = 'GlassCard';

export default GlassCard;
