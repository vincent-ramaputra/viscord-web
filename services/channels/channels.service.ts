import { Channel } from "@/interfaces/channel";
import { CreateChannelDTO } from "@/interfaces/dto/create-channel.dto";
import { UpdateChannelDTO } from "@/interfaces/dto/update-channel.dto";
import { CreateInviteDto } from "@/interfaces/dto/create-invite.dto";
import { Invite } from "@/interfaces/invite";
import { PermissionOverwrite } from "@/interfaces/permission-ovewrite";
import { updatePermissionOverwriteDTO } from "@/interfaces/dto/update-permission-overwrite.dto";
import { CreateVoiceTicketResponseDTO } from "@/interfaces/dto/create-voice-ticket-response.dto";
import { request } from "../request";


const GUILD_ENDPOINT = '/guilds'
const USER_ENDPOINT = '/users/me/channels'
const CHANNEL_ENDPOINT = '/channels'

export const getDMChannels = () => request<Channel[]>({
    method: 'GET',
    url: USER_ENDPOINT
});

export const createDMChannel = (recipientId: string) => request<Channel>({
    method: 'POST',
    url: USER_ENDPOINT,
    data: { recipientId }
});

export const createGuildChannel = ({ guildId, ...body }: CreateChannelDTO) => request<Channel>({
    method: 'POST',
    url: `${GUILD_ENDPOINT}/${guildId}/channels`,
    data: body
});

export const sendTypingStatus = (channelId: string) => request<void>({
    method: 'POST',
    url: `${CHANNEL_ENDPOINT}/${channelId}/typing`,
    data: { channelId }
});

export const deleteChannel = (channelId: string) => request<void>({
    method: 'DELETE',
    url: `${CHANNEL_ENDPOINT}/${channelId}`
});

export const updateChannel = (channelId: string, dto: UpdateChannelDTO) => request<Channel>({
    method: 'PATCH',
    url: `${CHANNEL_ENDPOINT}/${channelId}`,
    data: dto
});

export const ringChannelRecipients = (channelId: string) => request<void>({
    method: 'POST',
    url: `${CHANNEL_ENDPOINT}/${channelId}/call/ring`,
    data: { channelId }
});

export const createOrGetInvite = (dto: CreateInviteDto) => request<Invite>({
    method: 'POST',
    url: `${CHANNEL_ENDPOINT}/${dto.channelId}/invites`,
    data: dto
});

export const updatePermissionOverwrite = (dto: updatePermissionOverwriteDTO) => request<PermissionOverwrite>({
    method: 'PUT',
    url: `${CHANNEL_ENDPOINT}/${dto.channelId}/permissions/${dto.targetId}`,
    data: dto
});

export const deletePermissionOverwrite = (channelId: string, targetId: string) => request<void>({
    method: 'DELETE',
    url: `${CHANNEL_ENDPOINT}/${channelId}/permissions/${targetId}`
});

export const syncChannel = (channelId: string) => request<Channel>({
    method: 'POST',
    url: `${CHANNEL_ENDPOINT}/${channelId}/sync`
});

export const getChannelInvites = (channelId: string) => request<Invite[]>({
    method: 'GET',
    url: `${CHANNEL_ENDPOINT}/${channelId}/invites`
});

export const createVoiceTicket = (channelId: string) => request<CreateVoiceTicketResponseDTO>({
    method: 'POST',
    url: `${CHANNEL_ENDPOINT}/${channelId}/voice-ticket`
});
