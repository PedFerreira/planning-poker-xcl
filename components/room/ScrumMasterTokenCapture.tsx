"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { storeSmToken } from "@/lib/sm-token";

/**
 * Captura o token de SM da query string (?sm=...) na primeira carga da sala,
 * guarda em localStorage e limpa a URL — o link compartilhável nunca deve
 * carregar o token.
 */
export function ScrumMasterTokenCapture({ roomId }: { roomId: string }) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("sm");
    if (!token) return;

    storeSmToken(roomId, token);

    const url = new URL(window.location.href);
    url.searchParams.delete("sm");
    window.history.replaceState({}, "", url.pathname + url.search);
  }, [roomId, searchParams]);

  return null;
}
