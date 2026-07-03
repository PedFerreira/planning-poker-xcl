"use client";

import { useState, type FormEvent } from "react";
import { PARTICIPANT_ROLES, type ParticipantRole } from "@/types/domain";
import { generateParticipantId } from "@/lib/ids";
import { storeIdentity } from "@/lib/identity";
import { useIdentityStore } from "@/store/useIdentityStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function JoinForm({ roomId }: { roomId: string }) {
  const setIdentity = useIdentityStore((state) => state.setIdentity);
  const [name, setName] = useState("");
  const [role, setRole] = useState<ParticipantRole>(PARTICIPANT_ROLES[0]);
  const [roleOther, setRoleOther] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Informe seu nome.");
      return;
    }
    if (role === "Outro" && !roleOther.trim()) {
      setError("Descreva seu cargo.");
      return;
    }

    const identity = {
      participantId: generateParticipantId(),
      name: trimmedName,
      role,
      roleOther: role === "Outro" ? roleOther.trim() : undefined,
    };

    storeIdentity(roomId, identity);
    setIdentity(identity);
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl">Entrar na sala</CardTitle>
        <p className="text-sm text-muted-foreground">
          Diga quem você é para entrar na mesa de votação.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="grid gap-2">
            <Label htmlFor="name">Seu nome</Label>
            <Input
              id="name"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Ana Souza"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="role">Cargo</Label>
            <Select
              value={role}
              onValueChange={(value) => value && setRole(value as ParticipantRole)}
            >
              <SelectTrigger id="role" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PARTICIPANT_ROLES.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {role === "Outro" && (
            <div className="grid gap-2">
              <Label htmlFor="roleOther">Qual cargo?</Label>
              <Input
                id="roleOther"
                required
                value={roleOther}
                onChange={(e) => setRoleOther(e.target.value)}
                placeholder="Ex.: UX Designer"
              />
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit">Entrar</Button>
        </form>
      </CardContent>
    </Card>
  );
}
