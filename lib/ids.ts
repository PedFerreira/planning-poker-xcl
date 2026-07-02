import { customAlphabet } from "nanoid";

// Sem caracteres ambíguos (0/O, 1/I/l) para IDs que humanos vão ler/digitar em links de sala.
const roomIdAlphabet =
  "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

export const generateRoomId = customAlphabet(roomIdAlphabet, 10);

export const generateScrumMasterToken = customAlphabet(
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
  32
);

export const generateParticipantId = customAlphabet(
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
  16
);
