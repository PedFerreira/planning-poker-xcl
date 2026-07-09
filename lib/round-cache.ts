import type { RoundMirror } from "@/types/realtime";

/**
 * Cache pessoal (por aba) do último round conhecido — mesmo padrão de
 * lib/vote-storage.ts. Não é fonte de verdade compartilhada, só permite que
 * esta aba se auto-recupere ao reconectar/recarregar sem depender de outro
 * participante estar conectado no momento (ex.: o SM sozinho na sala dando
 * refresh). Também usado para semear a rodada 1 assim que a sala é criada,
 * antes mesmo do canal Realtime abrir.
 */
function key(roomId: string) {
  return `poker:${roomId}:round`;
}

export function storeLastKnownRound(roomId: string, round: RoundMirror) {
  window.sessionStorage.setItem(key(roomId), JSON.stringify(round));
}

export function getLastKnownRound(roomId: string): RoundMirror | null {
  const raw = window.sessionStorage.getItem(key(roomId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as RoundMirror;
  } catch {
    return null;
  }
}
