"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ShareLink() {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const url = `${window.location.origin}${window.location.pathname}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
      {copied ? "Link copiado!" : "Copiar link da sala"}
    </Button>
  );
}
