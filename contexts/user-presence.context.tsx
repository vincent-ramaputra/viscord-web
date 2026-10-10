"use client";

import { UserProfile } from "@/interfaces/user-profile";
import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";

type PresenceMap = Record<string, boolean>;
type UserProfileMap = Record<string, UserProfile>;

interface UserPresenceContextType {
  userProfileMap: UserProfileMap;
  presenceMap: PresenceMap;
  setPresenceMap: (map: PresenceMap) => void;
  updatePresence: (userId: string, isOnline: boolean) => void;
  isUserOnline: (userId: string) => boolean;
  setUserProfileMap: (userProfiles: UserProfileMap) => void;
  getUserProfile: (userId: string) => UserProfile | undefined;
  updateUserProfile: (userProfile: UserProfile) => void;
}

const UserPresenceContext = createContext<UserPresenceContextType | undefined>(undefined);

export const UserPresenceProvider = ({ children }: { children: ReactNode }) => {
  const [presenceMap, setPresenceMapState] = useState<PresenceMap>({});
  const [userProfileMap, setUserProfileMapState] = useState<UserProfileMap>({});
  // const [a, setA] = useState(0);
  const setPresenceMap = (map: PresenceMap) => {
    setPresenceMapState(map);
  };

  const updatePresence = (userId: string, isOnline: boolean) => {
    setPresenceMapState(prev => ({ ...prev, [userId]: isOnline }));
  };

  const isUserOnline = (userId: string) => {
    return !!presenceMap[userId];
  };


  const getUserProfile = useCallback((userId: string) => {
    return userProfileMap[userId]
  }, [userProfileMap]);

  const setUserProfileMap = (map: UserProfileMap) => {
    setUserProfileMapState(map);
  }

  const updateUserProfile = (userProfile: UserProfile) => {
    setUserProfileMapState(prev => ({...prev, [userProfile.id]: userProfile}));
  };

  return (
    <UserPresenceContext.Provider value={{ presenceMap, setPresenceMap, updatePresence, isUserOnline, userProfileMap, setUserProfileMap, getUserProfile, updateUserProfile }}>
      {children}
    </UserPresenceContext.Provider>
  );
};

export const useUserPresence = (): UserPresenceContextType => {
  const context = useContext(UserPresenceContext);
  if (!context) {
    throw new Error("useUserPresence must be used within a UserPresenceProvider");
  }
  return context;
};
