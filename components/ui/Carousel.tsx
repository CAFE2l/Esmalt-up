"use client";

import { 
  useCallback, 
  useEffect, 
  useMemo, 
  useRef, 
  useState 
} from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { LEDBorder, AmbientOrb } from "./LED";
import { zIndex } from "./tokens";

/**
 * Reusable Carousel Component
 * 
 * Features:
 * - Coverflow-style focus (center card is large with LED border, neighbors scale down)
 * - Drag/swipe with velocity-based snapping
 * - Click on side card to bring to center
 * - Keyboard navigation (arrows)
 * - Mouse wheel horizontal
 * - Autoplay (optional, pauses on interaction)
 * - Animated dots with layoutId
 * - Fixed clipping with gradient mask at edges
 * - Respects prefers-reduced-motion
 * - Full accessibility support
 */

interface CarouselItem {
  id: string;
  content: React.ReactNode;
  [key: string]: unknown;
}

interface CarouselProps<T extends CarouselItem> {
  items: T[];
  renderItem: (item: T, index: number, isActive: boolean, distanceFromCenter: number) => React.ReactNode;
  className?: string;
  itemClassName?: string;
  
  // Layout
  itemWidth?: number | string;
  itemHeight?: number | string;
  gap?: number;
  
  // Behavior
  autoplay?: boolean;
  autoplayInterval?: number;
  loop?: boolean;
  dragEnabled?: boolean;
  keyboardEnabled?: boolean;
  
  // Effects
  coverflow?: boolean;
  perspective?: number;
  withLED?: boolean;
  withAmbientOrbs?: boolean;
  
  // Navigation
  showArrows?: boolean;
  showDots?: boolean;
  arrowClassName?: string;
  dotClassName?: string;
  
  // Callbacks
  onChange?: (index: number) => void;
  onItemClick?: (item: T, index: number) => void;
  onAutoplayStop?: () => void;
  
  // IDs for analytics
  carouselId?: string;
}

function wrapIndex(index: number, length: number): number {
  return ((index % length) + length) % length;
}

export function Carousel<T extends CarouselItem>({
  items,
  renderItem,
  className = "",
  itemClassName = "",
  
  // Layout defaults
  itemWidth = "100%",
  itemHeight = "100%",
  gap = 24,
  
  // Behavior defaults
  autoplay = true,
  autoplayInterval = 6000,
  dragEnabled = true,
  keyboardEnabled = true,
  
  // Effects defaults
  coverflow = true,
  perspective = 1400,
  withLED = true,
  withAmbientOrbs = true,
  
  // Navigation defaults
  showArrows = true,
  showDots = true,
  arrowClassName = "",
  dotClassName = "",
  
  // Callbacks
  onChange,
  onItemClick,
  onAutoplayStop,
  
  // Analytics
  carouselId = "carousel",
}: CarouselProps<T>) {
  const reduceMotion = useReducedMotion();
  const length = items.length;
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const [index, setIndex] = useState(0);
  const [hoverPaused, setHoverPaused] = useState(false);
  const [userAutoplay, setUserAutoplay] = useState(autoplay);
  const [inView, setInView] = useState(true);
  const [containerWidth, setContainerWidth] = useState(0);

  // Track user interaction to disable autoplay permanently
  const userInteracted = useRef(false);

  // Spring physics for smooth movement
  const x = useMotionValue(0);
  const xSpring = useSpring(x, {
    stiffness: 300,
    damping: 30,
    mass: 1,
  });

  // Calculate item positions based on distance from center
  const getItemStyle = useCallback((distance: number) => {
    if (reduceMotion || !coverflow) {
      return {
        scale: 1,
        opacity: 1,
        filter: 'blur(0px)',
        rotateY: 0,
        zIndex: 1,
      };
    }

    const absDistance = Math.abs(distance);
    
    // Scale down based on distance
    const scale = Math.max(0.75, 1 - absDistance * 0.15);
    
    // Fade out based on distance
    const opacity = Math.max(0.4, 1 - absDistance * 0.2);
    
    // Blur based on distance
    const blur = Math.min(4, absDistance * 0.8);
    
    // 3D rotation
    const rotateY = distance * 25;
    
    // Z-index: center item on top
    const zIndex = Math.max(1, 5 - absDistance);
    
    return {
      scale,
      opacity,
      filter: `blur(${blur}px)`,
      rotateY: `${rotateY}deg`,
      zIndex,
    };
  }, [reduceMotion, coverflow]);

  // Handle navigation
  const go = useCallback((delta: number) => {
    if (length < 2) return;
    
    const newIndex = wrapIndex(index + delta, length);
    setIndex(newIndex);
    x.set(-newIndex * (containerWidth + gap));
    
    onChange?.(newIndex);
    
    if (userInteracted.current === false) {
      userInteracted.current = true;
      setUserAutoplay(false);
      onAutoplayStop?.();
    }
  }, [index, length, gap, containerWidth, onChange, onAutoplayStop, x]);

  // Handle direct index selection
  const goTo = useCallback((newIndex: number) => {
    if (newIndex === index) return;
    
    setIndex(newIndex);
    x.set(-newIndex * (containerWidth + gap));
    
    onChange?.(newIndex);
    
    if (userInteracted.current === false) {
      userInteracted.current = true;
      setUserAutoplay(false);
      onAutoplayStop?.();
    }
  }, [index, gap, containerWidth, onChange, onAutoplayStop, x]);

  // Autoplay logic
  const autoplayActive = useMemo(() => {
    return userAutoplay && 
      !hoverPaused && 
      inView && 
      !reduceMotion && 
      length > 1 && 
      !userInteracted.current;
  }, [userAutoplay, hoverPaused, inView, reduceMotion, length]);

  // Handle autoplay
  useEffect(() => {
    if (!autoplayActive) return;
    
    const id = setInterval(() => {
      go(1);
    }, autoplayInterval);
    
    return () => clearInterval(id);
  }, [autoplayActive, go, autoplayInterval]);

  // Intersection observer for inView state
  useEffect(() => {
    const element = containerRef.current;
    if (!element || typeof IntersectionObserver === "undefined") return;
    
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.2 }
    );
    
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Measure container width
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    
    resizeObserver.observe(element);
    return () => resizeObserver.disconnect();
  }, []);

  // Handle drag
  const handleDragStart = useCallback(() => {
    dragging.current = true;
    setHoverPaused(true);
  }, []);

  const handleDragEnd = useCallback((_event: unknown, info: { offset: { x: number }, velocity: { x: number } }) => {
    dragging.current = false;
    setHoverPaused(false);
    
    const velocityThreshold = 480;
    const distanceThreshold = 72;
    
    if (Math.abs(info.velocity.x) > velocityThreshold) {
      const delta = info.velocity.x > 0 ? -1 : 1;
      go(delta);
    } else if (Math.abs(info.offset.x) > distanceThreshold) {
      const delta = info.offset.x > 0 ? -1 : 1;
      go(delta);
    } else {
      // Snap back to current position
      x.set(-index * (containerWidth + gap));
    }
    
    userInteracted.current = true;
    setUserAutoplay(false);
    onAutoplayStop?.();
  }, [go, index, containerWidth, gap, onAutoplayStop, x]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!keyboardEnabled) return;
    
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      go(1);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      go(-1);
    }
  }, [keyboardEnabled, go]);

  // Handle wheel (horizontal)
  const handleWheel = useCallback((event: React.WheelEvent) => {
    if (!keyboardEnabled) return;
    
    event.preventDefault();
    const delta = Math.sign(event.deltaX || -event.deltaY);
    go(delta);
  }, [keyboardEnabled, go]);

  // Calculate visible items with padding
  const visibleItems = useMemo(() => {
    const padding = Math.floor(length / 2);
    const result: (T | null)[] = [];
    
    for (let i = -padding; i < length + padding; i++) {
      result.push(items[wrapIndex(i, length)] || null);
    }
    
    return result.filter(Boolean) as T[];
  }, [items, length]);

  // Arrow component
  const ArrowButton = ({ direction }: { direction: 'prev' | 'next' }) => (
    <motion.button
      type="button"
      aria-label={direction === 'prev' ? 'Anterior' : 'Próximo'}
      onClick={() => go(direction === 'prev' ? -1 : 1)}
      className={`absolute z-[${zIndex.fixed}] flex h-12 w-12 items-center justify-center rounded-full border border-rose-gold/40 bg-branco/90 text-rose-gold shadow-card backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:bg-rosa-blush hover:text-white hover:shadow-card-lg active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-gold focus-visible:ring-offset-2 ${arrowClassName}`}
      style={{
        left: direction === 'prev' ? 16 : undefined,
        right: direction === 'next' ? 16 : undefined,
        top: '50%',
        transform: 'translateY(-50%)',
      }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="h-5 w-5"
      >
        {direction === 'prev' ? (
          <path d="M15 5l-7 7 7 7" />
        ) : (
          <path d="M9 5l7 7-7 7" />
        )}
      </svg>
    </motion.button>
  );

  // Dot component
  const DotButton = ({ dotIndex }: { dotIndex: number }) => {
    const active = dotIndex === index;
    const item = items[dotIndex];
    const label = item?.id || `Item ${dotIndex + 1}`;

    return (
      <motion.button
        key={`dot-${dotIndex}`}
        type="button"
        aria-label={`Ir para ${label}`}
        aria-current={active ? "true" : undefined}
        onClick={() => goTo(dotIndex)}
        className={`relative h-2.5 rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-gold ${dotClassName}`}
        style={{
          width: active ? '2rem' : '0.625rem',
          background: active 
            ? 'linear-gradient(90deg, #e8a0b4, #d67a94, #b83d52)'
            : 'rgba(255, 255, 255, 0.2)',
          boxShadow: active ? '0 2px 4px rgba(229, 153, 168, 0.3)' : 'none',
        }}
        layoutId={`dot-${carouselId}`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        {/* LED glow on active dot */}
        {active && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              boxShadow: '0 0 15px rgba(232, 160, 180, 0.5)',
            }}
            animate={{
              boxShadow: [
                '0 0 15px rgba(232, 160, 180, 0.3)',
                '0 0 25px rgba(232, 160, 180, 0.6)',
                '0 0 15px rgba(232, 160, 180, 0.3)',
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}
      </motion.button>
    );
  };

  if (length === 0) return null;

  return (
    <section
      ref={containerRef}
      aria-roledescription="carousel"
      className={`relative overflow-hidden ${className}`}
      onMouseEnter={() => setHoverPaused(true)}
      onMouseLeave={() => setHoverPaused(false)}
      onFocus={() => setHoverPaused(true)}
      onBlur={() => setHoverPaused(false)}
      onKeyDown={handleKeyDown}
    >
      {/* Ambient orbs */}
      {withAmbientOrbs && !reduceMotion && (
        <>
          <AmbientOrb
            position="top-left"
            color="pink"
            size="md"
            disabled={reduceMotion}
          />
          <AmbientOrb
            position="top-right"
            color="rose"
            size="lg"
            disabled={reduceMotion}
          />
        </>
      )}

      {/* Carousel track */}
      <div
        className="relative mx-auto"
        style={{
          perspective: reduceMotion ? undefined : perspective,
          overflow: 'visible',
        }}
      >
        {/* Gradient mask to prevent clipping at edges */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-16"
          style={{
            background: 'linear-gradient(to right, rgb(var(--bege-claro)), transparent)',
          }}
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-16"
          style={{
            background: 'linear-gradient(to left, rgb(var(--bege-claro)), transparent)',
          }}
        />

        {/* Items container */}
        <motion.div
          className="relative flex"
          style={{
            x: xSpring,
            gap: gap,
            width: `calc(${itemWidth} * ${visibleItems.length} + ${gap}px * ${visibleItems.length - 1})`,
            height: itemHeight,
            transformStyle: 'preserve-3d',
          }}
          drag={dragEnabled && !reduceMotion ? 'x' : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.16}
          dragMomentum
          dragTransition={{ power: 0.15, timeConstant: 300 }}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onTouchStart={() => {
            setHoverPaused(true);
            userInteracted.current = true;
            setUserAutoplay(false);
          }}
          onTouchEnd={() => setHoverPaused(false)}
          onWheel={handleWheel}
        >
          {visibleItems.map((item, visibleIndex) => {
            const itemIndex = wrapIndex(visibleIndex - Math.floor(length / 2), length);
            const distanceFromCenter = visibleIndex - Math.floor(visibleItems.length / 2);
            const isActive = itemIndex === index;
            const itemStyle = getItemStyle(distanceFromCenter);

            return (
              <motion.div
                key={`${item.id}-${visibleIndex}`}
                className={`relative flex-shrink-0 ${itemClassName}`}
                style={{
                  ...itemStyle,
                  width: itemWidth,
                  height: itemHeight,
                  transformStyle: 'preserve-3d',
                }}
                initial={false}
                animate={itemStyle}
                transition={{
                  type: 'spring',
                  stiffness: 250,
                  damping: 30,
                }}
                onClick={() => {
                  if (dragging.current || isActive) return;
                  goTo(itemIndex);
                  onItemClick?.(item, itemIndex);
                }}
              >
                {/* LED border for active item */}
                {withLED && isActive && (
                  <LEDBorder disabled={reduceMotion}>
                    <div className="absolute inset-0" />
                  </LEDBorder>
                )}

                {/* Render item content */}
                {renderItem(item, itemIndex, isActive, distanceFromCenter)}
              </motion.div>
            );
          })}
        </motion.div>

        {/* Arrows */}
        {showArrows && length > 1 && (
          <>
            <ArrowButton direction="prev" />
            <ArrowButton direction="next" />
          </>
        )}
      </div>

      {/* Dots */}
      {showDots && length > 1 && (
        <div className="mt-8 flex items-center justify-center gap-3">
          <div className="flex items-center justify-center gap-2">
            {items.map((_, i) => (
              <DotButton key={`dot-${i}`} dotIndex={i} />
            ))}
          </div>

          {/* Autoplay toggle */}
          {autoplay && (
            <motion.button
              type="button"
              aria-label={userAutoplay ? 'Pausar apresentação' : 'Reproduzir apresentação'}
              onClick={() => {
                setUserAutoplay((value) => !value);
                if (userInteracted.current === false) {
                  userInteracted.current = true;
                }
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-rose-gold/40 bg-branco/90 text-rose-gold shadow-card transition-all duration-200 hover:scale-110 hover:bg-rosa-blush hover:text-white hover:shadow-card-lg active:scale-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-gold"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {userAutoplay ? (
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                  <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </motion.button>
          )}
        </div>
      )}
    </section>
  );
}

export default Carousel;
