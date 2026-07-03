import { cn } from "@/lib/utils";
import { XclMark } from "@/components/layout/XclMark";

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
        {/* Face: carta em tom marfim, como uma carta de baralho de verdade. */}
        <button
          type="button"
          disabled={disabled}
          onClick={onClick}
          className={cn(
            "absolute inset-0 flex items-center justify-center rounded-xl border-2 bg-[#F7F1E3] font-bold text-[#1c1712] [backface-visibility:hidden]",
            selected ? "border-primary ring-2 ring-primary/30" : "border-[#1c1712]/15",
            interactive && !disabled && "hover:border-primary/60",
            disabled && "opacity-50",
            !interactive && "cursor-default"
          )}
        >
          {label}
        </button>

        {/* Verso: vermelho de marca com textura e a marca XCL ao centro. */}
        <span
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl bg-primary [backface-visibility:hidden] [transform:rotateY(180deg)]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(135deg, rgba(255,255,255,0.07) 0px 6px, transparent 6px 12px)",
          }}
        >
          <span className="absolute inset-[3px] rounded-[10px] border border-white/20" />
          <XclMark className="absolute inset-0 m-auto h-1/2 w-1/2 text-white/25" />
        </span>
      </div>
    </div>
  );
}
