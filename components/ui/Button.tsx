"use client";

import { m as motion, useReducedMotion } from "framer-motion";
import { forwardRef } from "react";
import { LEDBorder } from "./LED";

/**
 * Button Component System
 * 
 * Three button variants:
 * - Primary: pink fill + LED glow
 * - Secondary: glass outline
 * - Ghost: transparent with hover effect
 * 
 * All with whileHover/whileTap micro-interactions and visible focus rings.
 */

// ============================================
// BUTTON BASE
// ============================================

interface ButtonBaseProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  glowOnHover?: boolean;
  ledBorder?: boolean;
}

const baseStyles = {
  fontWeight: 600,
  borderRadius: '9999px',
  transition: 'all 0.2s ease',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.5rem',
};

const sizeStyles = {
  sm: {
    padding: '0.5rem 1rem',
    fontSize: '0.875rem',
  },
  md: {
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
  },
  lg: {
    padding: '1rem 2rem',
    fontSize: '1.125rem',
  },
};

const variantStyles = {
  primary: {
    background: 'linear-gradient(90deg, #e8a0b4, #d67a94)',
    color: '#ffffff',
    border: 'none',
    boxShadow: '0 2px 4px rgba(201, 137, 145, 0.15), 0 8px 24px rgba(229, 153, 168, 0.2)',
  },
  secondary: {
    background: 'rgba(255, 255, 255, 0.08)',
    color: '#ffffff',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(12px) saturate(140%)',
    boxShadow: '0 2px 4px rgba(201, 137, 145, 0.15)',
  },
  ghost: {
    background: 'transparent',
    color: 'rgb(var(--foreground))',
    border: 'none',
  },
};

const hoverStyles = {
  primary: {
    background: 'linear-gradient(90deg, #d67a94, #b83d52)',
    boxShadow: '0 0 25px rgba(232, 160, 180, 0.4), 0 0 50px rgba(232, 160, 180, 0.2)',
    transform: 'translateY(-2px)',
  },
  secondary: {
    background: 'rgba(255, 255, 255, 0.12)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    transform: 'translateY(-2px)',
  },
  ghost: {
    background: 'rgba(255, 255, 255, 0.05)',
  },
};

const activeStyles = {
  primary: {
    transform: 'translateY(0)',
    boxShadow: '0 1px 2px rgba(201, 137, 145, 0.18), 0 2px 8px rgba(229, 153, 168, 0.16)',
  },
  secondary: {
    transform: 'translateY(0)',
  },
  ghost: {
    background: 'rgba(255, 255, 255, 0.1)',
  },
};

// ============================================
// BUTTON COMPONENT
// ============================================

export const Button = forwardRef<HTMLButtonElement, ButtonBaseProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      glowOnHover = true,
      ledBorder = false,
      className = "",
      disabled,
      ...props
    },
    ref
  ) => {
    const reduceMotion = useReducedMotion();
    const isDisabled = disabled || isLoading;

    const style = {
      ...baseStyles,
      ...sizeStyles[size],
      ...variantStyles[variant],
      width: fullWidth ? '100%' : undefined,
    };

    const baseClassName = `relative overflow-hidden ${className}`;

    return (
      <motion.button
        ref={ref}
        className={baseClassName}
        style={style}
        disabled={isDisabled}
        whileHover={!reduceMotion && !isDisabled ? hoverStyles[variant] : {}}
        whileTap={!reduceMotion && !isDisabled ? activeStyles[variant] : {}}
        onHoverStart={(e) => {
          if (!reduceMotion && !isDisabled) {
            e.currentTarget.style.transform = hoverStyles[variant].transform as string;
          }
        }}
        onHoverEnd={(e) => {
          if (!reduceMotion && !isDisabled) {
            e.currentTarget.style.transform = 'translateY(0)';
          }
        }}
        {...props}
      >
        {/* LED Border */}
        {ledBorder && !isDisabled && (
          <LEDBorder disabled={isDisabled}>
            <div className="absolute inset-0" />
          </LEDBorder>
        )}

        {/* Neon Glow Background (for primary variant) */}
        {variant === 'primary' && glowOnHover && !reduceMotion && (
          <m.div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(circle at center, rgba(232, 160, 180, 0.2), transparent 70%)',
              opacity: 0,
            }}
            whileHover={{
              opacity: 1,
            }}
            transition={{
              duration: 0.3,
            }}
          />
        )}

        {/* Loading spinner */}
        {isLoading && (
          <m.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-5 w-5"
            >
              <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
            </svg>
          </m.div>
        )}

        {/* Content */}
        <span className={`flex items-center gap-2 ${isLoading ? 'opacity-0' : ''}`}>
          {leftIcon && <span className="shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="shrink-0">{rightIcon}</span>}
        </span>

        {/* Focus ring */}
        <m.div
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{
            border: '2px solid transparent',
          }}
          whileFocus={{
            border: '2px solid rgba(232, 160, 180, 0.6)',
            boxShadow: '0 0 0 2px rgba(232, 160, 180, 0.2)',
          }}
        />
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

// ============================================
// PRIMARY BUTTON (convenience wrapper)
// ============================================

export const PrimaryButton = forwardRef<HTMLButtonElement, ButtonBaseProps>(
  (props, ref) => <Button ref={ref} variant="primary" {...props} />
);

PrimaryButton.displayName = 'PrimaryButton';

// ============================================
// SECONDARY BUTTON (glass outline)
// ============================================

export const SecondaryButton = forwardRef<HTMLButtonElement, ButtonBaseProps>(
  (props, ref) => <Button ref={ref} variant="secondary" {...props} />
);

SecondaryButton.displayName = 'SecondaryButton';

// ============================================
// GHOST BUTTON
// ============================================

export const GhostButton = forwardRef<HTMLButtonElement, ButtonBaseProps>(
  (props, ref) => <Button ref={ref} variant="ghost" {...props} />
);

GhostButton.displayName = 'GhostButton';

// ============================================
// ICON BUTTON
// ============================================

interface IconButtonProps extends Omit<ButtonBaseProps, 'leftIcon' | 'rightIcon'> {
  icon: React.ReactNode;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, children, ...props }, ref) => (
    <Button ref={ref} {...props}>
      {icon}
      {children && <span className="sr-only">{children}</span>}
    </Button>
  )
);

IconButton.displayName = 'IconButton';


