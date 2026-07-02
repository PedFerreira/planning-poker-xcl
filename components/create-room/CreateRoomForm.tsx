"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { DECK_LIST } from "@/config/decks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CreateRoomResponse } from "@/types/api";

export function CreateRoomForm() {
  const router = useRouter();
  const [projectName, setProjectName] = useState("");
  const [scrumMasterName, setScrumMasterName] = useState("");
  const [deckType, setDeckType] = useState(DECK_LIST[0].key);
  const [ticketCode, setTicketCode] = useState("");
  const [ticketUrl, setTicketUrl] = useState("");
  const [ticketDescription, setTicketDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectName,
          scrumMasterName,
          deckType,
          ticketCode,
          ticketUrl,
          ticketDescription,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? "Não foi possível criar a sala.");
        return;
      }

      const data = (await res.json()) as CreateRoomResponse;
      router.push(`/sala/${data.roomId}?sm=${data.scrumMasterToken}`);
    } catch {
      setError("Falha de conexão. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid gap-2">
        <Label htmlFor="projectName">Nome do projeto</Label>
        <Input
          id="projectName"
          required
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          placeholder="Ex.: Portal do Cliente"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="scrumMasterName">Seu nome (Scrum Master)</Label>
        <Input
          id="scrumMasterName"
          required
          value={scrumMasterName}
          onChange={(e) => setScrumMasterName(e.target.value)}
          placeholder="Ex.: Ana Souza"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="deckType">Formato de votação</Label>
        <Select
          value={deckType}
          onValueChange={(value) => value && setDeckType(value)}
        >
          <SelectTrigger id="deckType" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DECK_LIST.map((deck) => (
              <SelectItem key={deck.key} value={deck.key}>
                {deck.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="ticketCode">Ticket do Jira</Label>
        <Input
          id="ticketCode"
          required
          value={ticketCode}
          onChange={(e) => setTicketCode(e.target.value)}
          placeholder="Ex.: PROJ-123"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="ticketUrl">Link do ticket (opcional)</Label>
        <Input
          id="ticketUrl"
          type="url"
          value={ticketUrl}
          onChange={(e) => setTicketUrl(e.target.value)}
          placeholder="https://jira.xcl.digital/browse/PROJ-123"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="ticketDescription">Descrição breve da história</Label>
        <Textarea
          id="ticketDescription"
          value={ticketDescription}
          onChange={(e) => setTicketDescription(e.target.value)}
          rows={3}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={submitting}>
        {submitting ? "Criando sala…" : "Criar sala"}
      </Button>
    </form>
  );
}
