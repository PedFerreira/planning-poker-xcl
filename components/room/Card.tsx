import { cn } from "@/lib/utils";

export function Card({
  label,
  size = "md",
  selected = false,
  disabled = false,
  onClick,
  animateReveal = false,
}: {
  label: string;
  size?: "sm" | "md";
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  /** Mostra a carta já virada para baixo e a anima até a face frontal ao montar. */
  animateReveal?: boolean;
}) {
  const dimensions = size === "sm" ? "h-14 w-10 text-sm" : "h-20 w-14 text-lg";
  const interactive = Boolean(onClick);

  return (
    <div className={cn(dimensions, "shrink-0 [perspective:800px]")}>
      <div
        className={cn(
          "relative h-full w-full [transform-style:preserve-3d]",
          animateReveal && "[animation:card-flip-in_0.5s_ease-out_forwards]"
        )}
      >
        <button
          type="button"
          disabled={disabled}
          onClick={onClick}
          className={cn(
            "absolute inset-0 flex items-center justify-center rounded-xl border-2 bg-card font-bold [backface-visibility:hidden]",
            selected ? "border-primary text-primary ring-2 ring-primary/30" : "border-border text-foreground",
            interactive && !disabled && "hover:border-primary/60",
            disabled && "opacity-50",
            !interactive && "cursor-default"
          )}
        >
          {label}
        </button>
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl bg-primary text-[0.6em] font-bold tracking-wider text-primary-foreground/40 [backface-visibility:hidden] [transform:rotateY(180deg)]">
          XCL
        </span>
      </div>
    </div>
  );
}
