
export interface SendMessageInput {
    content: string;
    channelId: string;
    mentions: string[];
}

export type CreateMessageDTO = SendMessageInput & {
    attachments: {
        key: string;
        fileName: string;
    }[];
}
