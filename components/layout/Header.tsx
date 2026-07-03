import { Logo } from "@/components/layout/Logo";

export function Header({ right }: { right?: React.ReactNode }) {
  return (
    <header className="flex items-center justify-between border-b px-4 py-3 sm:px-6">
      <Logo />
      {right}
    </header>
  );
}
