
export interface SendMessageInput {
    content: string;
    channelId: string;
    mentions: string[];
}

export type CreateMessageDto = SendMessageInput & {
    attachments: {
        key: string;
        fileName: string;
    }[];
}
