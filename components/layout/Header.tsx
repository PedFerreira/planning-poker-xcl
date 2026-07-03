import { Logo } from "@/components/layout/Logo";

export function Header({ right }: { right?: React.ReactNode }) {
  return (
    <div className="sticky top-0 z-40 flex justify-center px-4 py-4">
      <header className="flex w-full max-w-3xl items-center justify-between gap-4 rounded-full border border-border bg-card/60 px-5 py-2.5 backdrop-blur-xl">
        <Logo />
        {right}
      </header>
    </div>
  );
}
