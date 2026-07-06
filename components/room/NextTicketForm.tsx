"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function NextTicketForm({
  submitting,
  onSubmit,
  onCancel,
}: {
  submitting: boolean;
  onSubmit: (fields: { ticketCode: string }) => void;
  onCancel: () => void;
}) {
  const [ticketCode, setTicketCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!ticketCode.trim()) {
      setError("Informe o código do ticket.");
      return;
    }
    setError(null);
    onSubmit({ ticketCode });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-2xl border bg-card p-5 shadow-sm"
    >
      <p className="text-sm font-semibold">Próximo ticket</p>

      <div className="grid gap-2">
        <Label htmlFor="nextTicketCode">Ticket do Jira</Label>
        <Input
          id="nextTicketCode"
          required
          autoFocus
          maxLength={15}
          value={ticketCode}
          onChange={(e) => setTicketCode(e.target.value)}
          placeholder="Ex.: PROJ-124"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Avançando…" : "Avançar ticket"}
        </Button>
      </div>
    </form>
  );
}
