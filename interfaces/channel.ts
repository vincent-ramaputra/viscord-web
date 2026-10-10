import { ChannelType } from "@/enums/channel-type.enum";
import { UserProfile } from "./user-profile";
import { UserChannelState } from "./user-channel-state";
import { PermissionOverwrite } from "./permission-ovewrite";

export interface Channel {
    id: string;
    name?: string;
    type: ChannelType;
    createdAt: Date;
    updatedAt: Date;
    parent?: Channel;
    isSynced: boolean;
    guildId: string;
    recipients?: UserProfile[];
    lastMessageId?: string;
    userChannelState: UserChannelState;
    permissionOverwrites: PermissionOverwrite[];
}