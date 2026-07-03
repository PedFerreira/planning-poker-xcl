import type { ParticipantRole } from "@/types/domain";

export type StoredIdentity = {
  participantId: string;
  name: string;
  role: ParticipantRole;
  roleOther?: string;
};

function key(roomId: string) {
  return `poker:${roomId}:identity`;
}

export function storeIdentity(roomId: string, identity: StoredIdentity) {
  window.sessionStorage.setItem(key(roomId), JSON.stringify(identity));
}

export function getStoredIdentity(roomId: string): StoredIdentity | null {
  const raw = window.sessionStorage.getItem(key(roomId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredIdentity;
  } catch {
    return null;
  }
}
