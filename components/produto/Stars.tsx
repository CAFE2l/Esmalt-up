import { cn } from "@/lib/cn";

interface StarsProps {
  rating: number;
  size?: number;
  className?: string;
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

export default function Stars({
  rating,
  size = 16,
  className,
  interactive = false,
  onChange,
}: StarsProps) {
  if (!interactive) {
    return (
      <span
        className={cn("inline-flex items-center gap-0.5 text-amber-400", className)}
        aria-label={`Avaliação ${rating.toFixed(1)} de 5`}
      >
        {Array.from({ length: 5 }).map((_, index) => {
          const filled = index + 1 <= Math.round(rating);
          return (
            <svg
              key={index}
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill={filled ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth={filled ? 0 : 1.5}
              style={{ width: size, height: size }}
            >
              <path d="M12 2l2.9 6.26 6.85.62-5.2 4.5 1.55 6.7L12 16.6 5.9 20.08l1.55-6.7-5.2-4.5 6.85-.62L12 2z" />
            </svg>
          );
        })}
      </span>
    );
  }

  return (
    <div
      className={cn("flex items-center gap-1", className)}
      role="radiogroup"
      aria-label="Nota da avaliação"
    >
      {Array.from({ length: 5 }).map((_, index) => {
        const value = index + 1;
        const filled = value <= Math.round(rating);
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={value === Math.round(rating)}
            aria-label={`${value} ${value === 1 ? "estrela" : "estrelas"}`}
            onClick={() => onChange?.(value)}
            className="text-2xl text-amber-400 transition-transform hover:scale-110 focus:outline-none"
            style={{ width: size + 8, height: size + 8 }}
          >
            <svg
              viewBox="0 0 24 24"
              fill={filled ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth={filled ? 0 : 1.5}
              style={{ width: size, height: size }}
            >
              <path d="M12 2l2.9 6.26 6.85.62-5.2 4.5 1.55 6.7L12 16.6 5.9 20.08l1.55-6.7-5.2-4.5 6.85-.62L12 2z" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}