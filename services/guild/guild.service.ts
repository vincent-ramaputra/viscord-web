import { Guild } from "@/interfaces/guild";
import { api } from "../api";
import { AxiosError, HttpStatusCode } from "axios";
import { Response } from "@/interfaces/response";
import { CreateGuildDto } from "@/interfaces/dto/create-guild.dto";
import { AssignRoleDTO } from "@/interfaces/dto/assign-role.dto";
import { GuildMember } from "@/interfaces/guild-member";
import { Role } from "@/interfaces/role";
import { UpdateMemberDTO } from "@/interfaces/dto/update-member.dto";
import { UpdateGuildDTO } from "@/interfaces/dto/update-guild.dto";
import { Invite } from "@/interfaces/invite";
import { DeleteRoleDTO } from "@/interfaces/dto/delete-role.dto";


const ENDPOINT = `/guilds`
export async function createGuild(dto: CreateGuildDto): Promise<Response<Guild>> {
    const formData = new FormData();
    if (dto.iconImage) {
        formData.append("icon", dto.iconImage);
    }
    formData.append("name", dto.name);

    try {
        const response = await api.post(ENDPOINT, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            withCredentials: true
        });
        if (response.status === HttpStatusCode.Created) {
            return Response.Success<Guild>({
                data: response.data.data,
                message: response.data.message
            });
        }
        return Response.Failed<Guild>({
            message: response.data.message
        });
    } catch (error) {
        if (error instanceof AxiosError)
            return Response.Failed<Guild>({
                message: error.response ? error.response.data.message as string : "An unknown Error occurred"
            });
    }

    return Response.Failed<Guild>({
        message: "An unknown error occurred."
    })
}

export async function getGuilds() {
    try {
        const response = await api.get(`${ENDPOINT}`, {
            withCredentials: true
        });
        if (response.status === HttpStatusCode.Ok) {
            return Response.Success<Guild[]>({
                data: response.data.data,
                message: response.data.message
            });
        }
        return Response.Failed<Guild[]>({
            message: response.data.message
        });
    } catch (error) {
        if (error instanceof AxiosError)
            return Response.Failed<Guild[]>({
                message: error.response ? error.response.data.message as string : "An unknown Error occurred"
            });
    }

    return Response.Failed<Guild[]>({
        message: "An unknown error occurred."
    })
}

export async function getGuildDetail(guildId: string): Promise<Response<Guild>> {
    try {
        const response = await api.get(`${ENDPOINT}/${guildId}`, {
            withCredentials: true
        });
        if (response.status === HttpStatusCode.Ok) {
            return Response.Success<Guild>({
                data: response.data.data,
                message: response.data.message
            });
        }
        return Response.Failed<Guild>({
            message: response.data.message
        });
    } catch (error) {
        if (error instanceof AxiosError)
            return Response.Failed<Guild>({
                message: error.response ? error.response.data.message as string : "An unknown Error occurred"
            });
    }

    return Response.Failed<Guild>({
        message: "An unknown error occurred."
    })
}

export async function leaveGuild(guildId: string): Promise<Response<null>> {
    try {
        const response = await api.post(`${ENDPOINT}/${guildId}/leave`, null, {
            withCredentials: true
        });
        if (response.status === HttpStatusCode.NoContent) {
            return Response.Success({
                data: response.data.data,
                message: response.data.message
            });
        }
        return Response.Failed({
            message: response.data.message
        });
    } catch (error) {
        if (error instanceof AxiosError)
            return Response.Failed({
                message: error.response ? error.response.data.message as string : "An unknown Error occurred"
            });
    }

    return Response.Failed({
        message: "An unknown error occurred."
    })
}

export async function assignRoleMembers(dto: AssignRoleDTO): Promise<Response<GuildMember[]>> {
    try {
        const response = await api.patch(`${ENDPOINT}/${dto.guildId}/roles/${dto.roleId}/members`, dto, {
            withCredentials: true
        });
        if (response.status === HttpStatusCode.Ok) {
            return Response.Success({
                data: response.data.data,
                message: response.data.message
            });
        }
        return Response.Failed({
            message: response.data.message
        });
    } catch (error) {
        if (error instanceof AxiosError)
            return Response.Failed({
                message: error.response ? error.response.data.message as string : "An unknown Error occurred"
            });
    }

    return Response.Failed({
        message: "An unknown error occurred."
    })
}

export async function createRole(guildId: string): Promise<Response<Role>> {
    try {
        const response = await api.post(`${ENDPOINT}/${guildId}/roles`, null, {
            withCredentials: true
        });
        if (response.status === HttpStatusCode.Ok) {
            return Response.Success({
                data: response.data.data,
                message: response.data.message
            });
        }
        return Response.Failed({
            message: response.data.message
        });
    } catch (error) {
        if (error instanceof AxiosError)
            return Response.Failed({
                message: error.response ? error.response.data.message as string : "An unknown Error occurred"
            });
    }

    return Response.Failed({
        message: "An unknown error occurred."
    })
}

export async function updateMember(dto: UpdateMemberDTO): Promise<Response<GuildMember>> {
    try {
        const response = await api.patch(`${ENDPOINT}/${dto.guildId}/members/${dto.memberId}`, dto, {
            withCredentials: true
        });
        if (response.status === HttpStatusCode.Ok) {
            return Response.Success({
                data: response.data.data,
                message: response.data.message
            });
        }
        return Response.Failed({
            message: response.data.message
        });
    } catch (error) {
        if (error instanceof AxiosError)
            return Response.Failed({
                message: error.response ? error.response.data.message as string : "An unknown Error occurred"
            });
    }

    return Response.Failed({
        message: "An unknown error occurred."
    })
}

export async function updateRole(dto: Role): Promise<Response<Role>> {
    try {
        const response = await api.patch(`${ENDPOINT}/${dto.guildId}/roles/${dto.id}`, dto, {
            withCredentials: true
        });
        if (response.status === HttpStatusCode.Ok) {
            return Response.Success({
                data: response.data.data,
                message: response.data.message
            });
        }
        return Response.Failed({
            message: response.data.message
        });
    } catch (error) {
        if (error instanceof AxiosError)
            return Response.Failed({
                message: error.response ? error.response.data.message as string : "An unknown Error occurred"
            });
    }

    return Response.Failed({
        message: "An unknown error occurred."
    })
}

export async function updateGuild(dto: UpdateGuildDTO): Promise<Response<Guild>> {
    try {
        const response = await api.patch(`${ENDPOINT}/${dto.guildId}/`, dto, {
            withCredentials: true
        });
        if (response.status === HttpStatusCode.Ok) {
            return Response.Success({
                data: response.data.data,
                message: response.data.message
            });
        }
        return Response.Failed({
            message: response.data.message
        });
    } catch (error) {
        if (error instanceof AxiosError)
            return Response.Failed({
                message: error.response ? error.response.data.message as string : "An unknown Error occurred"
            });
    }

    return Response.Failed({
        message: "An unknown error occurred."
    })
}

export async function getGuildInvites(guildId: string): Promise<Response<Invite[]>> {
    try {
        const response = await api.get(`${ENDPOINT}/${guildId}/invites/`, {
            withCredentials: true
        });
        if (response.status === HttpStatusCode.Ok) {
            return Response.Success({
                data: response.data.data,
                message: response.data.message
            });
        }
        return Response.Failed({
            message: response.data.message
        });
    } catch (error) {
        if (error instanceof AxiosError)
            return Response.Failed({
                message: error.response ? error.response.data.message as string : "An unknown Error occurred"
            });
    }

    return Response.Failed({
        message: "An unknown error occurred."
    })
}

export async function deleteRole(dto: DeleteRoleDTO): Promise<Response<null>> {
    try {
        const response = await api.delete(`${ENDPOINT}/${dto.guildId}/roles/${dto.roleId}`, {
            withCredentials: true
        });
        if (response.status === HttpStatusCode.NoContent) {
            return Response.Success({
                data: response.data.data,
                message: response.data.message
            });
        }
        return Response.Failed({
            message: response.data.message
        });
    } catch (error) {
        if (error instanceof AxiosError)
            return Response.Failed({
                message: error.response ? error.response.data.message as string : "An unknown Error occurred"
            });
    }

    return Response.Failed({
        message: "An unknown error occurred."
    })
}