"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogPopup,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogClose,
} from "@/components/ui/alert-dialog";
import { getSmToken } from "@/lib/sm-token";
import { cn } from "@/lib/utils";

export function CloseRoomButton({ roomId }: { roomId: string }) {
  const router = useRouter();
  const [closing, setClosing] = useState(false);

  async function handleClose() {
    const smToken = getSmToken(roomId);
    if (!smToken || closing) return;
    setClosing(true);
    try {
      await fetch(`/api/rooms/${roomId}`, {
        method: "DELETE",
        headers: { "x-sm-token": smToken },
      });
      router.push("/");
    } finally {
      setClosing(false);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
        Encerrar sala
      </AlertDialogTrigger>
      <AlertDialogPopup>
        <div className="flex flex-col gap-1">
          <AlertDialogTitle>Encerrar a sala?</AlertDialogTitle>
          <AlertDialogDescription>
            Todo mundo conectado vai ser desconectado imediatamente. Essa ação não pode ser desfeita.
          </AlertDialogDescription>
        </div>
        <AlertDialogFooter>
          <AlertDialogClose
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            disabled={closing}
          >
            Cancelar
          </AlertDialogClose>
          <Button type="button" variant="destructive" size="sm" onClick={handleClose} disabled={closing}>
            {closing ? "Encerrando…" : "Confirmar"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogPopup>
    </AlertDialog>
  );
}
