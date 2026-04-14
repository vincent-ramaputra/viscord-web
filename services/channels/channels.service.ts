import { Channel } from "@/interfaces/channel";
import { Response } from "@/interfaces/response";
import { api } from "../api";
import { AxiosError, HttpStatusCode } from "axios";
import { CreateChannelDTO } from "@/interfaces/dto/create-channel.dto";
import { UpdateChannelDTO } from "@/interfaces/dto/update-channel.dto";
import { CreateInviteDto } from "@/interfaces/dto/create-invite.dto";
import { Invite } from "@/interfaces/invite";
import { PermissionOverwrite } from "@/interfaces/permission-ovewrite";
import { updatePermissionOverwriteDTO } from "@/interfaces/dto/update-permission-overwrite.dto";


const GUILD_ENDPOINT = '/guilds'
const USER_ENDPOINT = '/users/me/channels'
const CHANNEL_ENDPOINT =  '/channels'
export async function getDMChannels(): Promise<Response<Channel[]>> {
    try {
        const response = await api.get(`${USER_ENDPOINT}`, {
            withCredentials: true
        });
        if (response.status === HttpStatusCode.Ok) {
            return Response.Success<Channel[]>({
                data: response.data.data,
                message: response.data.message
            });
        }
        return Response.Failed<Channel[]>({
            message: response.data.message
        });
    } catch (error) {
        if (error instanceof AxiosError)
            return Response.Failed<Channel[]>({
                message: error.response ? error.response.data.message as string : "An unknown Error occurred"
            });
    }

    return Response.Failed<Channel[]>({
        message: "An unknown error occurred."
    })
}

export async function createDMChannel(recipientId: string): Promise<Response<Channel>> {
    try {
        const response = await api.post(`${USER_ENDPOINT}`, { recipientId: recipientId }, {
            withCredentials: true
        });
        if (response.status === HttpStatusCode.Created) {
            return Response.Success<Channel>({
                data: response.data.data,
                message: response.data.message
            });
        }
        return Response.Failed<Channel>({
            message: response.data.message
        });
    } catch (error) {
        if (error instanceof AxiosError)
            return Response.Failed<Channel>({
                message: error.response ? error.response.data.message as string : "An unknown error occurred"
            });
    }

    return Response.Failed<Channel>({
        message: "An unknown error occurred."
    })
}

export async function createGuildChannel(request: CreateChannelDTO): Promise<Response<Channel | null>> {
    const { guildId, ...body } = request;
    try {
        const response = await api.post(`${GUILD_ENDPOINT}/${guildId}/channels`, body, {
            withCredentials: true
        });
        if (response.status === HttpStatusCode.Created) {
            return Response.Success<Channel>({
                data: response.data.data,
                message: response.data.message
            });
        }
        return Response.Failed<null>({
            message: response.data.message
        });
    } catch (error) {
        if (error instanceof AxiosError)
            return Response.Failed<null>({
                message: error.response ? error.response.data.message as string : "An unknown Error occurred"
            });
    }

    return Response.Failed<null>({
        message: "An unknown error occurred."
    })
}

export async function sendTypingStatus(channelId: string) {
    try {
        const response = await api.post(`${CHANNEL_ENDPOINT}/${channelId}/typing`, { channelId: channelId }, {
            withCredentials: true
        });
        if (response.status === HttpStatusCode.NoContent) {
            return Response.Success<null>({
                data: response.data.data,
                message: response.data.message
            });
        }
        return Response.Failed<null>({
            message: response.data.message
        });
    } catch (error) {
        if (error instanceof AxiosError)
            return Response.Failed<null>({
                message: error.response ? error.response.data.message as string : "An unknown Error occurred"
            });
    }

    return Response.Failed<null>({
        message: "An unknown error occurred."
    })
}

export async function deleteChannel(channelId: string) {
    try {
        const response = await api.delete(`${CHANNEL_ENDPOINT}/${channelId}`, {
            withCredentials: true
        });
        if (response.status === HttpStatusCode.NoContent) {
            return Response.Success<null>({
                data: response.data.data,
                message: response.data.message
            });
        }
        return Response.Failed<null>({
            message: response.data.message
        });
    } catch (error) {
        if (error instanceof AxiosError)
            return Response.Failed<null>({
                message: error.response ? error.response.data.message as string : "An unknown Error occurred"
            });
    }

    return Response.Failed<null>({
        message: "An unknown error occurred."
    })
}

export async function updateChannel(channelId: string, dto: UpdateChannelDTO): Promise<Response<Channel>> {
    try {
        const response = await api.patch(`${CHANNEL_ENDPOINT}/${channelId}`, dto, {
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


export async function ringChannelRecipients(channelId: string) {
    try {
        const response = await api.post(`${CHANNEL_ENDPOINT}/${channelId}/call/ring`, { channelId: channelId }, {
            withCredentials: true
        });
        if (response.status === HttpStatusCode.NoContent) {
            return Response.Success<null>({
                data: response.data.data,
                message: response.data.message
            });
        }
        return Response.Failed<null>({
            message: response.data.message
        });
    } catch (error) {
        if (error instanceof AxiosError)
            return Response.Failed<null>({
                message: error.response ? error.response.data.message as string : "An unknown Error occurred"
            });
    }

    return Response.Failed<null>({
        message: "An unknown error occurred."
    })
}

export async function createOrGetInvite(dto: CreateInviteDto): Promise<Response<Invite>> {
    try {
        const response = await api.post(`${CHANNEL_ENDPOINT}/${dto.channelId}/invites`, dto, {
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

export async function updatePermissionOverwrite(dto: updatePermissionOverwriteDTO): Promise<Response<PermissionOverwrite>> {
    try {
        const response = await api.put(`${CHANNEL_ENDPOINT}/${dto.channelId}/permissions/${dto.targetId}`, dto, {
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

export async function deletePermissionOverwrite(channelId: string, targetId: string): Promise<Response<null>> {
    try {
        const response = await api.delete(`${CHANNEL_ENDPOINT}/${channelId}/permissions/${targetId}`, {
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

export async function syncChannel(channelId: string): Promise<Response<Channel>> {
    try {
        const response = await api.post(`${CHANNEL_ENDPOINT}/${channelId}/sync`, null, {
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

export async function getChannelInvites(channelId: string): Promise<Response<Invite[]>> {
    try {
        const response = await api.get(`${CHANNEL_ENDPOINT}/${channelId}/invites`, {
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