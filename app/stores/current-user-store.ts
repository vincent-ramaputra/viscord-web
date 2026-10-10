import { UserStatus } from "@/enums/user-status.enum";
import { UserData } from "@/interfaces/user-data";
import { create } from "zustand";

interface CurrentUserStoreState {
    isAuthorized: boolean;
    user: null | UserData;
    setIsAuthorized: (isAuthorized: boolean) => void;
    setCurrentUser: (user: UserData | null) => void;
    updateStatus: (status: UserStatus) => void;
}

export const useCurrentUserStore = create<CurrentUserStoreState>((set) => ({
    isAuthorized: false,
    user: null,
    setIsAuthorized: (isAuthorized: boolean) => set({ isAuthorized }),
    setCurrentUser: user => set({ user }),
    updateStatus: (status) => {
        set((state) =>
            state.user
                ? {
                    user: {
                        ...state.user,
                        profile: {
                            ...state.user.profile,
                            status,
                        },
                    },
                }
                : state
        )
    }
}))