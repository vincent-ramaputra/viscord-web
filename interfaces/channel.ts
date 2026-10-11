import { ChannelType } from "@/enums/channel-type.enum";
import { UserProfile } from "./user-profile";
import { UserChannelState } from "./user-channel-state";
import { PermissionOverwrite } from "./permission-overwrite";

export interface BaseChannel {
    id: string;
    createdAt: string;
    updatedAt: string;
    lastMessageId?: string;
    userChannelState: UserChannelState;
}

export interface GuildChannel extends BaseChannel {
    name?: string;
    type: ChannelType.Category | ChannelType.Text | ChannelType.Voice;
    parent?: GuildChannel;
    isSynced: boolean;
    guildId: string;
    permissionOverwrites: PermissionOverwrite[];
}

export interface DMChannel extends BaseChannel{
    type: ChannelType.DM | ChannelType.Group;
    recipients: UserProfile[];
}

export type Channel = GuildChannel | DMChannel;