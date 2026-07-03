const SEAT_COLORS = [
  "oklch(0.6 0.14 264)",
  "oklch(0.62 0.15 155)",
  "oklch(0.65 0.16 40)",
  "oklch(0.62 0.17 330)",
  "oklch(0.65 0.14 200)",
  "oklch(0.62 0.16 90)",
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function colorForParticipant(participantId: string): string {
  return SEAT_COLORS[hashString(participantId) % SEAT_COLORS.length];
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
