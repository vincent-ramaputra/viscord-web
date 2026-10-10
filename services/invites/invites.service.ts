import { Guild } from "@/interfaces/guild";
import { request } from "../request";

const INVITE_ENDPOINT = `/invites`

export const deleteInvite = (inviteId: string) => request<void>({
    method: 'DELETE',
    url: `${INVITE_ENDPOINT}/${inviteId}/`
});

export const joinGuild = (inviteCode: string) => request<Guild>({
    method: 'POST',
    url: `${INVITE_ENDPOINT}/${inviteCode}/`
});
