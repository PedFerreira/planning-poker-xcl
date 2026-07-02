import Link from "next/link";

export default function RoomNotFound() {
  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold">Sala não encontrada</h1>
      <p className="text-sm text-muted-foreground">
        O link pode estar incorreto ou a sala pode ter sido removida.
      </p>
      <Link href="/" className="text-sm underline">
        Criar uma nova sala
      </Link>
    </div>
  );
}
