export type StoredVote = {
  roundId: string;
  cardValue: string;
};

function key(roomId: string) {
  return `poker:${roomId}:vote`;
}

export function storeOwnVote(roomId: string, vote: StoredVote) {
  window.sessionStorage.setItem(key(roomId), JSON.stringify(vote));
}

export function getOwnVote(roomId: string): StoredVote | null {
  const raw = window.sessionStorage.getItem(key(roomId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredVote;
  } catch {
    return null;
  }
}

export function clearOwnVote(roomId: string) {
  window.sessionStorage.removeItem(key(roomId));
}
