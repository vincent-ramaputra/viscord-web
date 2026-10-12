import { DMChannel, getDMRecipientId } from "@/interfaces/channel";
import { UserProfile } from "@/interfaces/user-profile";
import { create } from "zustand";

type UserProfileMap = Map<string, UserProfile>;


interface UserProfileStoreState {
    userProfiles: UserProfileMap;
    setUserProfiles: (userProfiles: UserProfileMap) => void;
    getUserProfile: (userId: string) => UserProfile | undefined;
    upsertUserProfile: (userProfile: UserProfile) => void;
}

export const useUserProfileStore = create<UserProfileStoreState>((set, get) => ({
    userProfiles: new Map(),
    setUserProfiles: (userProfiles: UserProfileMap) => {
        set({ userProfiles })
    },
    getUserProfile: (userId: string) => {
        return get().userProfiles.get(userId);
    },
    upsertUserProfile: (userProfile: UserProfile) => {
        set((state) => {

            const newMap = new Map(state.userProfiles);
            const existing = newMap.get(userProfile.id);
            if (!existing) {
                newMap.set(userProfile.id, userProfile);
            }
            else {
                newMap.set(userProfile.id, {
                    ...existing,
                    ...userProfile
                });
            }

            return { userProfiles: newMap };
        })
    }
}));


export function useGetUserProfile(userId: string) {
    return useUserProfileStore(state => state.getUserProfile(userId));
}

// The other user's profile in a DM, or undefined if it isn't loaded (render a placeholder, don't assert).
export function useDMRecipient(channel: DMChannel | undefined) {
    return useUserProfileStore(state => channel ? state.userProfiles.get(getDMRecipientId(channel)) : undefined);
}
