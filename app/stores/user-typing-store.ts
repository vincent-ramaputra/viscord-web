import { create } from "zustand"
import { useShallow } from "zustand/shallow"

interface TypingUser {
    userId: string
    channelId: string
    timeoutId: NodeJS.Timeout
}

interface UserTypingStoreState {
    typingUsers: Map<string, TypingUser>
    handleTypingStart: (channelId: string, userId: string) => void
    handleTypingStop: (channelId: string, userId: string) => void
    isUserTyping: (channelId: string, userId: string) => boolean
    getTypingUsersForChannel: (channelId: string) => TypingUser[];
}


const TYPING_TIMEOUT = 10000;

function toMapKey(channelId: string, userId: string) {
    return `${channelId}-${userId}`
}

export const useUserTypingStore = create<UserTypingStoreState>((set, get) => ({
    typingUsers: new Map(),

    isUserTyping: (channelId: string, userId: string) => {
        const key = toMapKey(channelId, userId);
        return get().typingUsers.has(key);
    },

    handleTypingStart: (channelId: string, userId: string) => {
        const key = toMapKey(channelId, userId);

        set((state) => {
            const newTypingUsers = new Map(state.typingUsers);
            const typingUser = newTypingUsers.get(key);

            if (typingUser) {
                clearTimeout(typingUser.timeoutId);
            }


            const id = setTimeout(() => {
                get().handleTypingStop(channelId, userId);
            }, TYPING_TIMEOUT);

            newTypingUsers.set(key, { channelId: channelId, userId: userId, timeoutId: id });
            return { typingUsers: newTypingUsers };
        });
    },

    handleTypingStop: (channelId: string, userId: string) => {
        const key = toMapKey(channelId, userId);

        set((state) => {
            const newTypingUsers = new Map(state.typingUsers);
            const typingUser = newTypingUsers.get(key);

            if (typingUser) {
                clearTimeout(typingUser.timeoutId);
                newTypingUsers.delete(key);
            }

            return { typingUsers: newTypingUsers };
        });
    },
    getTypingUsersForChannel: (channelId: string) => {
        const typingUsers = get().typingUsers;
        return Array.from(typingUsers.values()).filter(
            (user) => user.channelId === channelId
        );
    }
}))

export const useIsUserTyping = (channelId: string, userId: string) => {
    return useUserTypingStore(state => state.isUserTyping(channelId, userId));
};

export const useTypingUsersFromChannel = (channelId: string) => {
    return useUserTypingStore(useShallow(state => state.getTypingUsersForChannel(channelId)));
}