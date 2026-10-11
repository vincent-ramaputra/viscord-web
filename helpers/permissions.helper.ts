import { PermissionOverwriteTargetType } from "@/enums/permission-overwrite-target-type.enum";
import { ALL_PERMISSIONS } from "@/enums/permissions.enum";
import { GuildChannel } from "@/interfaces/channel";
import { Guild } from "@/interfaces/guild";
import { GuildMember } from "@/interfaces/guild-member";
import { PermissionOverwrite } from "@/interfaces/permission-overwrite";
import { Role } from "@/interfaces/role";



export function allowPermission(basePermission: bigint, permission: bigint) {
    return basePermission | permission;
}

export function denyPermission(basePermission: bigint, permission: bigint) {
    return basePermission & ~permission;
}

export function applyChannelOverwrites(basePermission: bigint, overwrites: PermissionOverwrite[], userId: string, memberRoles: Role[], guildId: string) {
    let effective: bigint = BigInt(basePermission);
    const everyoneOW = overwrites.find(ow => ow.targetId === guildId && ow.targetType === PermissionOverwriteTargetType.ROLE);
    if (everyoneOW) {
        effective &= BigInt(~everyoneOW.deny);
        effective |= BigInt(everyoneOW.allow);
    }

    let allow = 0n;
    let deny = 0n;

    for (const ow of overwrites) {
        if (ow.targetType === PermissionOverwriteTargetType.ROLE && memberRoles.find(role => role.id === ow.targetId)) {
            allow |= BigInt(ow.allow);
            deny |= BigInt(ow.deny);
        }
    }

    effective &= ~deny;
    effective |= allow;

    const memberOW = overwrites.find(ow => ow.targetType === PermissionOverwriteTargetType.MEMBER && ow.targetId === userId);
    if (memberOW) {
        effective &= BigInt(~memberOW.deny);
        effective |= BigInt(memberOW.allow);
    }

    return effective;
}

export function getEffectivePermission(member: GuildMember, guild: Guild, channel?: GuildChannel, parent?: GuildChannel): bigint {
    if (guild.ownerId === member.userId) {
        return ALL_PERMISSIONS;
    }

    const everyoneRole = guild.roles.find(role => role.id === guild.id);

    let basePermissions: bigint = everyoneRole ? BigInt(everyoneRole.permissions) : 0n;

    const roles = guild.roles.filter(role => member.roles.find(roleId => roleId === role.id));

    for (const role of roles) {
        basePermissions = allowPermission(basePermissions, BigInt(role.permissions));
    }

    if (channel) {
        basePermissions = applyChannelOverwrites(basePermissions, channel.isSynced && parent ? parent.permissionOverwrites : channel.permissionOverwrites, member.userId, roles, guild.id);
    }

    return basePermissions;
}

export function checkPermission(memberPermission: bigint, permission: bigint) {
    return (memberPermission & permission) === permission;
}

export function getPermissionStatus(overwrite: PermissionOverwrite, perm: bigint): -1 | 0 | 1 {
    if ((BigInt(overwrite.deny) & perm) === perm) return -1;
    if ((BigInt(overwrite.allow) & perm) === perm) return 1;
    return 0;
}