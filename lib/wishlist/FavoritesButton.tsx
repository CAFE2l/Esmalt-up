"use client";

import { Heart } from "lucide-react";
import { m as motion, useReducedMotion } from "framer-motion";
import { useAuth } from "@/lib/AuthContext";
import { useAuthGate } from "@/components/AuthGateModal";
import { useFavoriteToggle } from "./useFavorites";
import type { FavoriteProductInput } from "./FavoritesContext";

interface FavoritesButtonProps {
  product: FavoriteProductInput;
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  textClassName?: string;
  iconClassName?: string;
  guard?: () => void;
}

const sizeClasses = {
  sm: "h-9 w-9",
  md: "h-11 w-11",
  lg: "h-12 w-12",
};

export function FavoritesButton({
  product,
  className = "",
  size = "md",
  showText = false,
  textClassName = "",
  iconClassName = "",
}: FavoritesButtonProps) {
  const reduceMotion = useReducedMotion();
  const { user } = useAuth();
  const { isFavorite, toggleFavorite, isLoading } = useFavoriteToggle(product.id);
  const { guard, modal } = useAuthGate(
    user,
    "Entre em sua conta para criar sua lista de desejos.",
    "Faça login para salvar favoritos",
  );

  return (
    <>
      <motion.button
        type="button"
        aria-label={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
        aria-pressed={isFavorite}
        onClick={() => guard(() => void toggleFavorite(product))}
        disabled={isLoading}
        whileHover={reduceMotion ? undefined : { scale: 1.08 }}
        whileTap={reduceMotion ? undefined : { scale: 0.92 }}
        className={`group/favorite inline-flex items-center justify-center gap-2 rounded-full border border-white/60 bg-white/75 text-foreground/60 shadow-[0_8px_24px_rgba(38,20,29,0.18)] backdrop-blur-xl transition-[background,color,border,box-shadow] duration-200 hover:border-pink-200 hover:bg-white hover:text-pink-500 hover:shadow-[0_8px_28px_rgba(236,72,153,0.28)] disabled:cursor-wait disabled:opacity-60 ${
          isFavorite
            ? "border-pink-200 bg-gradient-to-br from-pink-500 to-rose-400 text-white shadow-[0_8px_24px_rgba(236,72,153,0.3)]"
            : ""
        } ${sizeClasses[size]} ${className}`}
      >
        <motion.span
          key={isFavorite ? "saved" : "unsaved"}
          initial={reduceMotion ? false : { scale: isFavorite ? 0.55 : 1 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 440, damping: 18 }}
          className="relative flex"
        >
          <Heart
            className={`${iconClassName || "h-5 w-5"} transition-colors duration-200 ${
              isFavorite ? "fill-white stroke-white" : "fill-transparent"
            }`}
            strokeWidth={isFavorite ? 2.1 : 1.7}
          />
        </motion.span>
        {showText && (
          <span className={`text-sm font-semibold ${textClassName}`}>
            {isFavorite ? "Salvo" : "Favoritar"}
          </span>
        )}
      </motion.button>
      {modal}
    </>
  );
}

export function HeartIconButton({
  product,
  className = "",
  size = "md",
  iconClassName = "",
}: Omit<FavoritesButtonProps, "showText" | "textClassName">) {
  return (
    <FavoritesButton
      product={product}
      className={className}
      size={size}
      iconClassName={iconClassName}
    />
  );
}

export function FloatingHeartButton({
  product,
  className = "",
  position = "top-right",
}: {
  product: FavoriteProductInput;
  className?: string;
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
}) {
  const positionClasses = {
    "top-right": "absolute right-3 top-3",
    "top-left": "absolute left-3 top-3",
    "bottom-right": "absolute bottom-3 right-3",
    "bottom-left": "absolute bottom-3 left-3",
  };

  return (
    <FavoritesButton
      product={product}
      className={`z-20 ${positionClasses[position]} ${className}`}
      size="md"
    />
  );
}
