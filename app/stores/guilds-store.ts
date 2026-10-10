import { ChannelType } from "@/enums/channel-type.enum";
import { Channel } from "@/interfaces/channel";
import { Guild } from "@/interfaces/guild";
import { GuildMember } from "@/interfaces/guild-member";
import { Role } from "@/interfaces/role";
import { create } from "zustand";

type GuildMap = Map<string, Guild>;

// Backend omits userChannelState on some responses (e.g. create/join guild), but the UI reads it unguarded.
// Default it here, at the store boundary, so every channel in the store satisfies the Channel type.
function normalizeChannel(channel: Channel): Channel {
    return { ...channel, userChannelState: channel.userChannelState ?? { unreadCount: 0, mentionCount: 0 } };
}

function normalizeGuild(guild: Guild): Guild {
    return guild.channels ? { ...guild, channels: guild.channels.map(normalizeChannel) } : guild;
}

interface GuildStoreState {
    guilds: Map<string, Guild>;
    setGuilds: (guilds: GuildMap) => void;
    upsertGuild: (guild: Guild) => void;
    removeGuild: (guildId: string) => void;
    getGuild: (guildId: string) => Guild | undefined;
    getChannel: (channelId: string) => Channel | undefined;
    upsertChannel: (guildId: string, channelId: string, channel: Channel) => void;
    deleteChannel: (guildId: string, channelId: string) => void;
    updateChannelLastRead: (guildId: string, channelId: string, messageId: string) => void;
    upsertMember: (guildId: string, member: GuildMember) => void;
    removeMember: (guildId: string, memberId: string) => void;
    upsertRole: (guildId: string, role: Role) => void;
    removeRole: (guildId: string, roleId: string) => void;
}

export const useGuildsStore = create<GuildStoreState>((set, get) => ({
    guilds: new Map(),
    setGuilds: (guilds) => set({ guilds: new Map([...guilds].map(([id, guild]) => [id, normalizeGuild(guild)])) }),
    upsertGuild: (incoming) => set((state) => {
        const guild = normalizeGuild(incoming);
        const newGuilds = new Map(state.guilds);
        const existing = newGuilds.get(guild.id);
        if (!existing) {
            newGuilds.set(guild.id, guild);
        } else {
            const updatedGuild: Guild = {
                ...existing,
                ...guild,
                channels: guild.channels ?? existing.channels,
                members: guild.members ?? existing.members,
                roles: guild.roles ?? existing.roles,
            };

            newGuilds.set(guild.id, updatedGuild);
        }

        return { guilds: newGuilds };
    }),
    removeGuild: (guildId) => set((state) => {
        const newGuilds = new Map(state.guilds);
        newGuilds.delete(guildId);

        return { guilds: newGuilds };
    }),
    getGuild: (guildId) => get().guilds.get(guildId),
    getChannel: (channelId) => {
        const guilds = get().guilds;
        for (const guild of Array.from(guilds.values())) {
            const channel = guild.channels.find(ch => ch.id === channelId);
            if (channel) return channel;
        }

        return undefined;
    },
    deleteChannel: (guildId, channelId) => {
        set((state) => {
            const guild = state.guilds.get(guildId);
            if (!guild) return state;

            const deletedChannel = guild.channels.find(ch => ch.id === channelId);
            if (!deletedChannel) return state;

            let updatedChannels = guild.channels;

            if (deletedChannel.type === ChannelType.Category) {
                updatedChannels = updatedChannels.map(ch =>
                    ch.parent?.id === deletedChannel.id
                        ? { ...ch, parent: undefined }
                        : ch
                );
            }

            updatedChannels = updatedChannels.filter((ch) => ch.id !== channelId);

            const updatedGuild: Guild = { ...guild, channels: updatedChannels };

            const newGuilds = new Map(state.guilds);
            newGuilds.set(guildId, updatedGuild);

            return { guilds: newGuilds };
        })
    },
    upsertChannel: (guildId, channelId, channel) => {
        set((state) => {
            const guild = state.guilds.get(guildId);
            if (!guild) return state;
            let updatedChannels = guild.channels
            if (guild.channels.find(ch => ch.id === channelId)) {
                updatedChannels = updatedChannels.map((ch) => {
                    if (ch.id === channelId) {
                        const newChannel = { ...ch, ...channel };
                        return newChannel;
                    }
                    else return ch;
                });
            }
            else {
                updatedChannels = [...updatedChannels, normalizeChannel(channel)];
            }

            const updatedGuild: Guild = { ...guild, channels: updatedChannels };

            const newGuilds = new Map(state.guilds);
            newGuilds.set(guildId, updatedGuild);

            return { guilds: newGuilds };
        })
    },
    upsertMember: (guildId, member) => {
        set(state => {
            const guild = state.guilds.get(guildId);
            if (!guild) return state;

            const existingMember = guild.members.find(m => m.userId === member.userId);
            const updatedMember = existingMember
                ? {
                    ...existingMember,
                    ...Object.fromEntries(
                        Object.entries(member).filter(([, v]) => v !== undefined)
                    ),
                }
                : member;


            const updatedGuild: Guild = {
                ...guild,
                members: [...guild.members.filter(m => m.userId !== member.userId), updatedMember],
            };

            const newGuilds = new Map(state.guilds);
            newGuilds.set(guildId, updatedGuild);

            return { guilds: newGuilds }
        });
    },
    removeMember: (guildId, memberId) => {
        set(state => {
            const guild = state.guilds.get(guildId);
            if (!guild) return state;

            const updatedGuild: Guild = {
                ...guild,
                members: guild.members.filter(m => m.userId !== memberId),
            };

            const newGuilds = new Map(state.guilds);
            newGuilds.set(guildId, updatedGuild);

            return { guilds: newGuilds }
        });
    },
    updateChannelLastRead: (guildId, channelId, messageId) => {
        set((state) => {
            const guild = state.guilds.get(guildId);
            if (!guild) return state;

            const updatedChannels = guild.channels.map((channel) =>
                channel.id === channelId
                    ? { ...channel, lastReadId: messageId }
                    : channel
            );

            const updatedGuild: Guild = { ...guild, channels: updatedChannels };

            const newGuilds = new Map(state.guilds);
            newGuilds.set(guildId, updatedGuild);

            return { guilds: newGuilds };
        })
    },
    upsertRole: (guildId, role) => {
        set(state => {
            const guild = state.guilds.get(guildId);
            if (!guild) return state;

            const existingRole = guild.roles.find(r => r.id === role.id);
            const updatedRole = existingRole
                ? {
                    ...existingRole,
                    ...Object.fromEntries(
                        Object.entries(role).filter(([, v]) => v !== undefined)
                    ),
                }
                : role;


            const updatedGuild: Guild = {
                ...guild,
                roles: [...guild.roles.filter(r => r.id !== role.id), updatedRole],
            };

            const newGuilds = new Map(state.guilds);
            newGuilds.set(guildId, updatedGuild);

            return { guilds: newGuilds }
        });
    },
    removeRole: (guildId, roleId) => {
        set(state => {
            const guild = state.guilds.get(guildId);
            if (!guild) return state;

            const updatedGuild: Guild = {
                ...guild,
                roles: guild.roles.filter(r => r.id !== roleId),
                members: guild.members.map(m => {
                    m.roles = m.roles.filter(id => id !== roleId);
                    return m;
                })
            };

            const newGuilds = new Map(state.guilds);
            newGuilds.set(guildId, updatedGuild);

            return { guilds: newGuilds }
        });

    }
}))

export function useGetGuild(guildId: string) {
    return useGuildsStore.getState().getGuild(guildId);
}

export function useGetGuildChannel(channelId: string) {
    return useGuildsStore.getState().getChannel(channelId);
}

