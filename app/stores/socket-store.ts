import { io, Socket } from "socket.io-client";
import { create } from "zustand";

interface SocketStoreState {
    socket: Socket | undefined,
    initializeSocket: () => Socket,
    removeSocket: () => any
}

export const useSocketStore = create<SocketStoreState>((set, get) => ({
    socket: undefined,
    initializeSocket: () => {
        const { socket } = get();
        if (socket) return socket;

        const newSocket = io(process.env.NEXT_PUBLIC_WS_GATEWAY!, {
            withCredentials: true,
            reconnection: true,
            reconnectionDelay: 5000,
            autoConnect: false
        });

        set({ socket: newSocket });

        return newSocket;
    },
    removeSocket: () => set(state => {
        const socket = state.socket;
        if (!socket) return { socket: undefined };

        socket.disconnect();
        socket.removeAllListeners();

        return { socket: undefined };
    })
}))