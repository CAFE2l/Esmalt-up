"use client";

import { m as motion, useReducedMotion } from "framer-motion";
import { useFavoriteToggle } from "./useFavorites";
import { type Product } from "@/lib/catalogData";
import { NeonGlow } from "@/components/ui/LED";

/**
 * FavoritesButton - Animated heart icon for wishlist
 * 
 * Features:
 * - Spring-powered animation on toggle
 * - Pop effect when adding
 * - Glass/blur effects
 * - Accessible with ARIA labels
 * - Optimistic UI
 */

interface FavoritesButtonProps {
  product: Product;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  textClassName?: string;
}

const sizeClasses = {
  sm: 'h-8 w-8 text-sm',
  md: 'h-10 w-10 text-base',
  lg: 'h-12 w-12 text-lg',
};

const heartVariants = {
  initial: { scale: 1, color: 'rgba(var(--foreground-rgb), 0.5)' },
  animate: { 
    scale: [1, 1.3, 1], 
    color: ['rgba(var(--foreground-rgb), 0.5)', '#e8a0b4', 'rgba(232, 160, 180, 0.8)'] 
  },
  exit: { scale: 1, color: 'rgba(var(--foreground-rgb), 0.5)' },
  filled: { scale: 1, color: '#e8a0b4' },
};

export function FavoritesButton({
  product,
  className = "",
  size = "md",
  showText = false,
  textClassName = "",
}: FavoritesButtonProps) {
  const reduceMotion = useReducedMotion();
  const { isFavorite, toggleFavorite, isLoading } = useFavoriteToggle(product.id);
  const sizeClass = sizeClasses[size];

  // Heart icon SVG paths
  const outlineHeart = (
    <path 
      d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );

  const filledHeart = (
    <path 
      d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
      fill="currentColor"
      stroke="none"
    />
  );

  return (
    <motion.button
      type="button"
      aria-label={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      aria-pressed={isFavorite}
      onClick={() => toggleFavorite(product)}
      disabled={isLoading}
      className={`flex items-center gap-2 rounded-full bg-branco/90 border border-rose-gold/20 p-2 transition-all duration-200 hover:border-rose-gold backdrop-blur-xl ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Neon glow effect */}
      <NeonGlow color="pink" intensity="sm" disabled={!isFavorite}>
        <motion.svg
          viewBox="0 0 24 24"
          className={`shrink-0 ${sizeClass}`}
          initial={reduceMotion ? {} : "initial"}
          animate={reduceMotion ? {} : (isFavorite ? "filled" : "initial")}
          variants={reduceMotion ? {} : heartVariants}
          transition={reduceMotion ? {} : {
            duration: 0.5,
            ease: "easeOut",
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {isFavorite ? filledHeart : outlineHeart}
        </motion.svg>
      </NeonGlow>

      {showText && (
        <span className={`text-sm font-medium transition-colors ${isFavorite ? 'text-rose-gold' : 'text-foreground/60'} ${textClassName}`}>
          {isFavorite ? "Favoritado" : "Favoritar"}
        </span>
      )}
    </motion.button>
  );
}

/**
 * Simple heart icon without text
 */
export function HeartIconButton({
  product,
  className = "",
  size = "md",
  iconClassName = "",
}: Omit<FavoritesButtonProps, 'showText' | 'textClassName'>) {
  const { isFavorite, toggleFavorite, isLoading } = useFavoriteToggle(product.id);
  const sizeClass = sizeClasses[size];

  return (
    <motion.button
      type="button"
      aria-label={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      aria-pressed={isFavorite}
      onClick={() => toggleFavorite(product)}
      disabled={isLoading}
      className={`flex items-center justify-center rounded-full p-1.5 transition-all duration-200 hover:bg-rosa-claro/20 ${className}`}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      <motion.svg
        viewBox="0 0 24 24"
        className={`shrink-0 ${sizeClass} ${iconClassName}`}
        initial={false}
        animate={isFavorite ? "filled" : "initial"}
        variants={{
          initial: { 
            color: 'rgba(var(--foreground-rgb), 0.5)',
            scale: 1,
          },
          filled: { 
            color: '#e8a0b4',
            scale: 1,
          },
        }}
        transition={{ duration: 0.3 }}
      >
        {isFavorite ? filledHeart : outlineHeart}
      </motion.svg>
    </motion.button>
  );
}

/**
 * Floating heart button for product cards
 */
export function FloatingHeartButton({
  product,
  className = "",
  position = "top-right",
}: {
  product: Product;
  className?: string;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}) {
  const positionClasses = {
    'top-right': 'absolute top-3 right-3',
    'top-left': 'absolute top-3 left-3',
    'bottom-right': 'absolute bottom-3 right-3',
    'bottom-left': 'absolute bottom-3 left-3',
  };

  return (
    <div className={positionClasses[position]}>
      <HeartIconButton
        product={product}
        className={`z-10 ${className}`}
        size="md"
      />
    </div>
  );
}


