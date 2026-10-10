import { Message } from "@/interfaces/message";
import { CreateMessageDto } from "@/interfaces/dto/create-message.dto";
import { CreateAttachmentResponseDTO } from "@/interfaces/dto/create-attachment-response.dto";
import { CreateAttachmentDTO } from "@/interfaces/dto/create-attachment.dto";
import { requestRaw } from "../request";

// message-service returns the message(s) directly, not wrapped in the
// { status, message, data } envelope the NestJS services use, hence requestRaw.
const messagePath = (channelId: string, ...segments: string[]) => {
    return `/channels/${channelId}/messages${segments.length ? '/' + segments.join('/') : ''}`;
}

const attachmentPath = (channelId: string) => `/channels/${channelId}/attachments`

export const getMessages = (channelId: string) => requestRaw<Message[]>({
    method: 'GET',
    url: messagePath(channelId)
});

export const sendMessage = (dto: CreateMessageDto) => requestRaw<Message>({
    method: 'POST',
    url: messagePath(dto.channelId),
    data: dto
});

export const acknowledgeMessage = (channelId: string, messageId: string) => requestRaw<void>({
    method: 'POST',
    url: messagePath(channelId, messageId, 'ack')
});

export const createAttachment = (channelId: string, files: CreateAttachmentDTO) => requestRaw<CreateAttachmentResponseDTO>({
    method: 'POST',
    url: attachmentPath(channelId),
    data: files
});
