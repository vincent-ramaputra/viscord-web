import { Guild } from "@/interfaces/guild";
import { CreateGuildDto } from "@/interfaces/dto/create-guild.dto";
import { AssignRoleDTO } from "@/interfaces/dto/assign-role.dto";
import { GuildMember } from "@/interfaces/guild-member";
import { Role } from "@/interfaces/role";
import { UpdateMemberDTO } from "@/interfaces/dto/update-member.dto";
import { UpdateGuildDTO } from "@/interfaces/dto/update-guild.dto";
import { Invite } from "@/interfaces/invite";
import { DeleteRoleDTO } from "@/interfaces/dto/delete-role.dto";
import { request } from "../request";


const ENDPOINT = `/guilds`
export const createGuild = (dto: CreateGuildDto) => {
    const formData = new FormData();
    if (dto.iconImage) {
        formData.append("icon", dto.iconImage);
    }
    formData.append("name", dto.name);

    return request<Guild>({
        method: 'POST',
        url: ENDPOINT,
        headers: {
            'Content-Type': 'multipart/form-data'
        },
        data: formData
    });
};

export const getGuilds = () => request<Guild[]>({
    method: 'GET',
    url: ENDPOINT
});

export const getGuildDetail = (guildId: string) => request<Guild>({
    method: 'GET',
    url: `${ENDPOINT}/${guildId}`
});

export const leaveGuild = (guildId: string) => request<void>({
    method: 'POST',
    url: `${ENDPOINT}/${guildId}/leave`
});

export const assignRoleMembers = (dto: AssignRoleDTO) => request<GuildMember[]>({
    method: 'PATCH',
    url: `${ENDPOINT}/${dto.guildId}/roles/${dto.roleId}/members`,
    data: dto
});

export const createRole = (guildId: string) => request<Role>({
    method: 'POST',
    url: `${ENDPOINT}/${guildId}/roles`
});

export const updateMember = (dto: UpdateMemberDTO) => request<GuildMember>({
    method: 'PATCH',
    url: `${ENDPOINT}/${dto.guildId}/members/${dto.memberId}`,
    data: dto
});

export const updateRole = (dto: Role) => request<Role>({
    method: 'PATCH',
    url: `${ENDPOINT}/${dto.guildId}/roles/${dto.id}`,
    data: dto
});

export const updateGuild = (dto: UpdateGuildDTO) => request<Guild>({
    method: 'PATCH',
    url: `${ENDPOINT}/${dto.guildId}/`,
    data: dto
});

export const getGuildInvites = (guildId: string) => request<Invite[]>({
    method: 'GET',
    url: `${ENDPOINT}/${guildId}/invites/`
});

export const deleteRole = (dto: DeleteRoleDTO) => request<void>({
    method: 'DELETE',
    url: `${ENDPOINT}/${dto.guildId}/roles/${dto.roleId}`
});
