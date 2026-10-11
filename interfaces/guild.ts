import { GuildChannel } from "./channel";
import { GuildMember } from "./guild-member";
import { Role } from "./role";

export interface Guild {
    id: string;
    name: string;
    ownerId: string;
    iconURL?: string;
    channels: GuildChannel[];
    createdAt: string;
    updatedAt: string;
    members: GuildMember[];
    roles: Role[];
}