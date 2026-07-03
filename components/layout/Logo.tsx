import { XclLogo } from "@/components/layout/XclLogo";

export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <XclLogo className="h-4 w-auto text-foreground" />
      <span className="h-4 w-px bg-border" />
      <span className="text-sm font-medium text-muted-foreground">
        Planning Poker
      </span>
    </div>
  );
}
