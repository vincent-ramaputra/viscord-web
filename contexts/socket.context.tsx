"use client"
import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import Relationship from "@/interfaces/relationship";
import { FRIEND_ADDED_EVENT, FRIEND_REMOVED_EVENT, FRIEND_REQUEST_RECEIVED_EVENT, GET_VOICE_STATES_EVENT, GUILD_UPDATE_EVENT, MESSAGE_RECEIVED_EVENT, USER_PRESENCE_UPDATE_EVENT, USER_PROFILE_UPDATE_EVENT, USER_TYPING_EVENT, VOICE_RING_CANCEL, VOICE_RING_DISMISS_EVENT, VOICE_RING_EVENT, VOICE_UPDATE_EVENT } from "@/constants/events";
import { MESSAGES_CACHE, RELATIONSHIPS_CACHE } from "@/constants/query-keys";
import { Message } from "@/interfaces/message";
import { HttpStatusCode } from "axios";
import { refreshToken } from "@/services/auth/auth.service";
import { useUserProfileStore } from "@/app/stores/user-profiles-store";
import { useUserTypingStore } from "@/app/stores/user-typing-store";
import { VoiceState } from "@/interfaces/voice-state";
import { getVoiceStateKey,  useVoiceStateStore } from "@/app/stores/voice-state-store";
import { VoiceEventDTO } from "@/interfaces/dto/voice-event.dto";
import { VoiceEventType } from "@/enums/voice-event-type";
import { useMediasoupStore } from "@/app/stores/mediasoup-store";
import { useSocketStore } from "@/app/stores/socket-store";
import { useUserPresenceStore } from "@/app/stores/user-presence-store";
import { useChannelsStore } from "@/app/stores/channels-store";
import { GuildUpdateDTO } from "@/interfaces/dto/guild-update.dto";
import { GuildUpdateType } from "@/enums/guild-update-type.enum";
import { useGuildsStore } from "@/app/stores/guilds-store";
import { Channel } from "@/interfaces/channel";
import { GuildMember } from "@/interfaces/guild-member";
import { UserProfile } from "@/interfaces/user-profile";
import { UserPresenceUpdateDTO } from "@/interfaces/dto/user-presence-update.dto";
import { usePlaySound } from "@/app/stores/audio-store";
import { useCurrentUserStore } from "@/app/stores/current-user-store";
import { voiceSession } from "@/lib/voice/voice-session";

export interface SocketContextType {
    socket: Socket | undefined;
    isReady: boolean;
}

const SocketContext = createContext<SocketContextType>(null!);

export function useSocket() {
    return useContext(SocketContext);
}

export default function SocketProvider({ children }: { children: ReactNode }) {
    const { socket, initializeSocket, removeSocket } = useSocketStore();
    const [isConnected, setIsConnected] = useState(false);

    const queryClient = useQueryClient();
    const { presenceMap, updatePresence } = useUserPresenceStore();
    const { userProfiles, upsertUserProfile } = useUserProfileStore();
    const { handleTypingStart, handleTypingStop } = useUserTypingStore();
    const { updateVoiceState, removeVoiceState, setVoiceStates } = useVoiceStateStore();


    function handleFriendReceived(payload: Relationship) {;
        upsertUserProfile(payload.user);
        queryClient.setQueryData<Relationship[]>([RELATIONSHIPS_CACHE], (old) => {
            if (!old) {
                return [payload];
            }
            return [...old, payload];
        })
    }

    function handleFriendAdded(payload: Relationship) {
        queryClient.setQueryData<Relationship[]>([RELATIONSHIPS_CACHE], (old) => {
            if (!old) {
                return [payload];
            }
            return old.map(rel => rel.id === payload.id ? payload : rel);
        })
    }

    function handleFriendRemoved(payload: Relationship) {
        queryClient.setQueryData<Relationship[]>([RELATIONSHIPS_CACHE], (old) => {
            if (!old) {
                return [];
            }
            return old.filter(rel => rel.id !== payload.id);
        })
    }


    function handlePresenceUpdate(dto: UserPresenceUpdateDTO) {
        updatePresence(dto.userId, dto.isOnline);
    }

    function handleMessageReceived(payload: Message) {
        handleTypingStop(payload.channelId, payload.senderId);
        const { getChannel, updateChannel } = useChannelsStore.getState();
        const { upsertChannel, getGuild, getChannel: getGuildChannel } = useGuildsStore.getState();

        const channel = getChannel(payload.channelId);
        if (channel) {
            updateChannel({ ...channel, lastMessageId: payload.id, userChannelState: { ...channel.userChannelState, unreadCount: channel.userChannelState.unreadCount + 1 } });
        }
        else {
            const channel = getGuildChannel(payload.channelId)
            if (!channel) return;
            upsertChannel(channel.guildId, channel.id, { ...channel, lastMessageId: payload.id, userChannelState: { ...channel.userChannelState, unreadCount: channel.userChannelState.unreadCount + 1 } })
        }

        queryClient.setQueryData<Message[]>([MESSAGES_CACHE, payload.channelId], (old) => {
            if (!old) {
                return [];
            }

            const message = { ...payload, createdAt: new Date(payload.createdAt) };

            const newMessages = [...old, message];
            return newMessages;
        })
    }

    const handleUserStatusUpdate = (payload: UserProfile) => {
        upsertUserProfile(payload);
    };

    const handleUserTyping = (payload: { userId: string, channelId: string }) => {
        console.log('typing', payload);
        handleTypingStart(payload.channelId, payload.userId);
    };

    const handleVoiceStateUpdate = useCallback(async (event: VoiceEventDTO) => {
        const user = useCurrentUserStore.getState().user;
        const { channelId } = useMediasoupStore.getState();
        if (event.type === VoiceEventType.VOICE_LEAVE) {
            if (event.userId === user?.id) voiceSession.handleServerLeave(event.channelId);
            removeVoiceState(event.channelId, event.userId);
            usePlaySound('voice-leave');
        }
        else {
            console.log('updating voice state');
            updateVoiceState(event.data);
            if (event.type === VoiceEventType.VOICE_JOIN && (event.userId === user?.id || event.channelId === channelId)) {
                usePlaySound('voice-join');
            }
        }
    }, [removeVoiceState, updateVoiceState]);

    const handleGetVoiceStates = useCallback((payload: VoiceState[]) => {
        const map: Map<string, VoiceState> = new Map();
        for (const vs of payload) {
            map.set(getVoiceStateKey(vs.channelId, vs.userId), new VoiceState(vs.userId, vs.channelId, vs.isMuted, vs.isDeafened));
        }
        setVoiceStates(map);
    }, [setVoiceStates]);

    function handleGuildUpdate(dto: GuildUpdateDTO) {
        console.log('guild update', dto);
        const { deleteChannel, upsertMember, removeMember, upsertChannel, upsertRole, upsertGuild, removeRole } = useGuildsStore.getState();
        switch (dto.type) {
            case GuildUpdateType.MEMBER_JOIN: upsertMember(dto.guildId, dto.data); break;
            case GuildUpdateType.MEMBER_LEAVE: removeMember(dto.guildId, dto.data); break;
            case GuildUpdateType.CHANNEL_DELETE: deleteChannel(dto.guildId, dto.data); break;
            case GuildUpdateType.CHANNEL_UPDATE: upsertChannel(dto.guildId, (dto.data as Channel).id, dto.data); break;
            case GuildUpdateType.MEMBERS_UPDATE: {
                for (const member of (dto.data as GuildMember[])) {
                    upsertMember(dto.guildId, member);
                }
                break;
            }
            case GuildUpdateType.ROLE_UPDATE: upsertRole(dto.guildId, dto.data); break;
            case GuildUpdateType.GUILD_UPDATE: upsertGuild(dto.data); break;
            case GuildUpdateType.ROLE_DELETE: removeRole(dto.guildId, dto.data); break;
        }

    }

    useEffect(() => {
        // const socket = io(process.env.NEXT_PUBLIC_WS_GATEWAY!, {
        //     withCredentials: true,
        //     reconnection: true,
        //     reconnectionDelay: 5000,
        // })
        console.log('intiializing socket');
        const socket = initializeSocket();

        const handleConnect = () => {
            console.log('Socket connected');
            setIsConnected(true);
        };

        const handleDisconnect = () => {
            // console.log('Socket disconnected');
            setIsConnected(false);
        };

        const handleConnectError = (error: any) => {
            // console.log('Socket connection error:', error.description);
            if (error.description === HttpStatusCode.Unauthorized) {
                refreshToken();
            }
        };

        socket!.on('connect', handleConnect);
        socket!.on('disconnect', handleDisconnect);
        socket!.on('connect_error', handleConnectError);
        socket!.on(FRIEND_REQUEST_RECEIVED_EVENT, handleFriendReceived);
        socket!.on(FRIEND_REMOVED_EVENT, handleFriendRemoved);
        socket!.on(FRIEND_ADDED_EVENT, handleFriendAdded);
        socket!.on(USER_PRESENCE_UPDATE_EVENT, handlePresenceUpdate);
        socket!.on(MESSAGE_RECEIVED_EVENT, handleMessageReceived);
        socket!.on(USER_TYPING_EVENT, handleUserTyping);
        socket!.on(USER_PROFILE_UPDATE_EVENT, handleUserStatusUpdate);
        socket!.on(VOICE_UPDATE_EVENT, handleVoiceStateUpdate);
        socket!.on(GET_VOICE_STATES_EVENT, handleGetVoiceStates);
        socket.on(GUILD_UPDATE_EVENT, handleGuildUpdate);

        socket.connect();
        const handleBeforeUnload = () => {
            voiceSession.leave();
            socket?.disconnect();
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        // setSocket(socket);
        return () => {
            removeSocket();
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);


    return (
        <SocketContext.Provider value={{ socket, isReady: isConnected }}>
            {children}
        </SocketContext.Provider>
    );
}