"use client";

import { create } from "zustand";
import type { StoredIdentity } from "@/lib/identity";

type IdentityState = {
  identity: StoredIdentity | null;
  hydrated: boolean;
  setIdentity: (identity: StoredIdentity) => void;
  hydrate: (identity: StoredIdentity | null) => void;
};

export const useIdentityStore = create<IdentityState>((set) => ({
  identity: null,
  hydrated: false,
  setIdentity: (identity) => set({ identity, hydrated: true }),
  hydrate: (identity) => set({ identity, hydrated: true }),
}));
