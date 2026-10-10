import { CURRENT_USER_CACHE, DM_CHANNELS_CACHE, GUILDS_CACHE, MESSAGES_CACHE, RELATIONSHIPS_CACHE } from "@/constants/query-keys";
import { Guild } from "@/interfaces/guild";
import { getDMChannels } from "@/services/channels/channels.service";
import { getGuildDetail, getGuildInvites, getGuilds } from "@/services/guild/guild.service";
import { getMessages } from "@/services/messages/messages.service";
import { useQuery, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import { Message } from "@/interfaces/message"
import { getRelationships } from "@/services/relationships/relationships.service";
import { getCurrentUserData } from "@/services/users/users.service";
import Relationship from "@/interfaces/relationship";
import { Channel } from "@/interfaces/channel";
import { UserData } from "@/interfaces/user-data";

export function useCurrentUserQuery() {
    return useQuery({
        staleTime: Infinity,
        queryKey: [CURRENT_USER_CACHE],
        queryFn: async () => {
            const res = await getCurrentUserData();
            if (!res.success) {
                throw Error();
            }

            return res.data!;
        }
    });
}

export function useUpdateCurrentUser() {
    const queryClient = useQueryClient();

    const updateCurrentUser = (userData: Partial<UserData>) => {
        queryClient.setQueryData<UserData>([CURRENT_USER_CACHE], (old) =>
            old ? { ...old, ...userData } : old
        );
    };

    return updateCurrentUser;
}

export function useDMChannelsQuery(options?: Omit<UseQueryOptions<Channel[], Error>, "queryKey" | "queryFn">) {
    return useQuery({
        ...options,
        staleTime: Infinity,
        queryKey: [DM_CHANNELS_CACHE],
        queryFn: async () => {
            const res = await getDMChannels();
            if (res.success) {
                return res.data!;
            }

            return [];
        }
    })
}

export function useGuildsQuery() {
    return useQuery({
        staleTime: Infinity,
        queryKey: [GUILDS_CACHE],
        queryFn: async () => {
            const res = await getGuilds();
            if (res.success) {
                return res.data!;
            }

            return [];
        }
    })
}

export function useGuildDetailQuery(guildId: string) {
    const queryClient = useQueryClient();
    return useQuery({
        staleTime: Infinity,
        queryKey: [GUILDS_CACHE, guildId],
        queryFn: async () => {
            const res = await getGuildDetail(guildId);

            if (!res.success) {
                throw Error();
            }
            queryClient.setQueryData<Guild[]>([GUILDS_CACHE], (old) => {
                if (!old) {
                    return [res.data!];
                }

                return old.map(g => g.id === res.data!.id ? res.data! : g);
            })

            return res.data!;
        }
    })
}

export function useMessagesQuery(channelId: string) {
    return useQuery({
        staleTime: Infinity,
        queryKey: [MESSAGES_CACHE, channelId],
        queryFn: async () => {
            const res = await getMessages(channelId);
            if (!res.success) {
                return [];
            }

            const data = res.data!.map(m => ({ ...m, createdAt: new Date(m.createdAt), updatedAt: new Date(m.updatedAt) }) as Message)

            return data.sort((a, b) => a.createdAt > b.createdAt ? 1 : a.createdAt < b.createdAt ? -1 : 0);
        }
    })
}

export function useRelationshipsQuery(options?: Omit<UseQueryOptions<Relationship[], Error>, "queryKey" | "queryFn">) {
    return useQuery({
        ...options,
        staleTime: Infinity,
        queryKey: [RELATIONSHIPS_CACHE],
        queryFn: async () => {
            const res = await getRelationships();
            if (!res.success) {
                throw Error();
            }
            return res.data!;
        },
    });
}

export function useGetGuildInvites(guildId: string) {
    return useQuery({
        queryKey: ['guildInvites', guildId],
        queryFn: async ({ queryKey }) => {
            const [, guildId] = queryKey;
            const res = await getGuildInvites(guildId as string);
            if (!res.success) throw Error();
            return res.data!;
        },
        staleTime: 0
    });
}