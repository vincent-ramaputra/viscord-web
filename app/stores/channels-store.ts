import { ChannelType } from "@/enums/channel-type.enum";
import { Channel } from "@/interfaces/channel";
import { create } from "zustand";
import { useShallow } from "zustand/shallow";

type ChannelMap = Map<string, Channel>;

interface ChannelsStoreState {
    channels: ChannelMap;
    setChannels: (channels: ChannelMap) => void;
    updateChannel: (channel: Channel) => void;
    getChannel: (channelId: string) => Channel | undefined;
    getFriendChannel: (userId: string) => Channel | undefined;
}

export const useChannelsStore = create<ChannelsStoreState>((set, get) => ({
    channels: new Map(),
    setChannels: (channels: ChannelMap) => set({ channels }),
    updateChannel: (channel: Channel) => {
        set(state => {
            const newChannels = new Map(state.channels);
            newChannels.set(channel.id, channel);
            return { channels: newChannels };
        });
    },
    getChannel: (channelId: string) => {
        return get().channels.get(channelId);
    },
    getFriendChannel: (userId: string) => {
        return findFriendChannel(get().channels, userId);
    }
}))

// Pure, so components can select the `channels` Map and look up during render.
export function findFriendChannel(channels: ChannelMap, userId: string) {
    return Array.from(channels.values()).find(ch => ch.recipients?.some(r => r.id === userId));
}

export const useGetChannel = (channelId: string) => {
    return useChannelsStore(state => state.getChannel(channelId))
}

export const useGetDMChannels = () => {
    return useChannelsStore(useShallow(state => Array.from(state.channels.values()).filter(ch => ch.type === ChannelType.DM)));
}