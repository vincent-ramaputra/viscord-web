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

// The other user in a 1:1 DM: guild-service leaves the current user out of `recipients`.
// Only an ID: profiles are read from useUserProfileStore, since the copies embedded in the channel
// aren't updated by USER_PROFILE_UPDATE_EVENT. Group channels can't be created yet; they'll need
// their own display rule (channel name or member list) instead of the first recipient.
export function getDMRecipientId(channel: DMChannel): string {
    return channel.recipients[0].id;
}