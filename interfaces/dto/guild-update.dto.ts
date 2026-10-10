import { GuildUpdateType } from "@/enums/guild-update-type.enum";
import { GuildMember } from "../guild-member";
import { Channel } from "../channel";
import { Role } from "../role";
import { Guild } from "../guild";

type GuildUpdate<T extends GuildUpdateType, D> = {guildId: string, type: T, data: D};

export type GuildUpdateDTO =
| GuildUpdate<GuildUpdateType.MEMBER_JOIN, GuildMember>
| GuildUpdate<GuildUpdateType.MEMBER_LEAVE, string>
| GuildUpdate<GuildUpdateType.CHANNEL_UPDATE, Channel>
| GuildUpdate<GuildUpdateType.CHANNEL_DELETE, string>
| GuildUpdate<GuildUpdateType.MEMBERS_UPDATE, GuildMember[]>
| GuildUpdate<GuildUpdateType.ROLE_UPDATE, Role>
| GuildUpdate<GuildUpdateType.GUILD_UPDATE, Guild>
| GuildUpdate<GuildUpdateType.ROLE_DELETE, string>;