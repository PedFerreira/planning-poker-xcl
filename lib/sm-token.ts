function key(roomId: string) {
  return `poker:${roomId}:smToken`;
}

export function storeSmToken(roomId: string, token: string) {
  window.localStorage.setItem(key(roomId), token);
}

export function getSmToken(roomId: string): string | null {
  return window.localStorage.getItem(key(roomId));
}
