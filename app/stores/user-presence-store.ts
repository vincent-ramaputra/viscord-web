"use client";

import { create } from "zustand";

type PresenceMap = Map<string, boolean>;

interface UserPresenceStore {
  presenceMap: PresenceMap;
  setPresenceMap: (map: PresenceMap) => void;
  updatePresence: (userId: string, isOnline: boolean) => void;
  isUserOnline: (userId: string) => boolean;
}

export const useUserPresenceStore = create<UserPresenceStore>((set, get) => ({
  presenceMap: new Map(),

  setPresenceMap: (map) => set({ presenceMap: map }),

  updatePresence: (userId, isOnline) => {
    set((state) => {
      const newMap = new Map(state.presenceMap);
      if (isOnline) {
        newMap.set(userId, true);
      } else {
        newMap.delete(userId);
      }
      return { presenceMap: newMap };
    });
  },

  isUserOnline: (userId) => !!get().presenceMap.get(userId),
}));
