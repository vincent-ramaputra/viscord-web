export interface CreateInviteDTO {
    channelId?: string;
    guildId: string;
    maxAge: number | null;
}
