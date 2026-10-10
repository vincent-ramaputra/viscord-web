import { io, Socket } from "socket.io-client";
import { ClientToServerEvents, ServerToClientEvents } from "./sfu-protocol";

type RequestEvent = {
    [K in keyof ClientToServerEvents]: Parameters<ClientToServerEvents[K]> extends [...unknown[], (res: never) => void] ? K : never
}[keyof ClientToServerEvents];
type RequestArgs<E extends RequestEvent> = Parameters<ClientToServerEvents[E]> extends [...infer A, unknown] ? A : never;
type RequestResult<E extends RequestEvent> = Parameters<ClientToServerEvents[E]> extends [...unknown[], (res: infer R) => void] ? NonNullable<R> : never;

type SendEvent = Exclude<keyof ClientToServerEvents, RequestEvent>
type SendArgs<E extends SendEvent> = Parameters<ClientToServerEvents[E]>;

type ListenEvent = keyof ServerToClientEvents;

export class SfuClient {
    private readonly socket: Socket<ServerToClientEvents, ClientToServerEvents>;
    private rejectConnect?: (reason?: unknown) => void;
    
    constructor(url: string, ticket: string) {
        this.socket = io(url, {
            auth: { ticket },
            autoConnect: false,
            reconnection: false
        });
    }

    connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.rejectConnect = reject;
            
            this.socket.once('connect', () => {
                this.socket.removeListener('connect_error', reject);
                resolve();
            });
            this.socket.once('connect_error', reject);

            this.socket.connect();
        });
    }

    close() {
        this.rejectConnect?.(new Error('SFU client closed'));
        this.socket.disconnect();
        this.socket.removeAllListeners();
    }

    async request<E extends RequestEvent>(event: E, ...args: RequestArgs<E>): Promise<RequestResult<E>> {
        if (!this.socket.connected) {
            throw new Error(`SFU request ${event} failed: not connected`);
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const res = await this.socket.timeout(5000).emitWithAck(event, ...(args as any));

        if (res == null) {
            throw new Error(`SFU request ${event} failed: received 'null'`);
        }

        return res;
    }

    send<E extends SendEvent>(event: E, ...args: SendArgs<E>): void {
        if (!this.socket.connected) return;

        this.socket.emit(event, ...args);
    }

    on<E extends ListenEvent>(event: E, handler: ServerToClientEvents[E]): () => void {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.socket.on(event, handler as any);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const unsubscribe = () => this.socket.off(event, handler as any);
        return unsubscribe;
    }

    onDisconnect(handler: (reason: Socket.DisconnectReason) => void): () => void {
        this.socket.on('disconnect', handler);

        const unsubscribe = () => this.socket.off('disconnect', handler);
        return unsubscribe;
    }
}