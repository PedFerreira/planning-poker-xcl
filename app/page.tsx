import { CreateRoomForm } from "@/components/create-room/CreateRoomForm";
import { Header } from "@/components/layout/Header";
import { XclMark } from "@/components/layout/XclMark";

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-1 flex-col overflow-hidden">
      <div aria-hidden className="absolute inset-y-0 left-0 w-1 bg-primary" />
      <XclMark
        aria-hidden
        className="pointer-events-none absolute -right-16 -bottom-24 h-[115%] w-auto text-primary opacity-[0.07]"
      />

      <div className="relative z-10 flex flex-1 flex-col">
        <Header />

        <div className="flex flex-1 flex-col items-center justify-center gap-10 px-4 py-16">
          <div className="flex max-w-xl flex-col items-center gap-5 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-white/[0.04] px-4 py-1.5 text-xs text-muted-foreground">
              <span className="size-1.5 animate-pulse rounded-full bg-primary" />
              Sem login — crie a sala e compartilhe o link
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight text-balance sm:text-5xl">
              Estimativas não travam.{" "}
              <em className="text-primary not-italic">Seu time decide rápido.</em>
            </h1>
            <p className="text-base text-muted-foreground sm:text-lg">
              Planning Poker colaborativo para os squads da XCL — crie uma
              sala e chame o time.
            </p>
          </div>

          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-8 shadow-2xl shadow-black/40">
            <CreateRoomForm />
          </div>
        </div>
      </div>
    </div>
  );
}
