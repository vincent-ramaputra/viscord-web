import { MessageStatus } from "@/enums/message-status.enum"
import { Attachment } from "../attachment"

export interface MessageDTO {
    id: string
    senderId: string
    content: string
    channelId: string
    isPinned: boolean
    createdAt: string
    updatedAt: string
    mentions: string[]
    attachments: Attachment[]
    clientId?: string
    status?: MessageStatus
}