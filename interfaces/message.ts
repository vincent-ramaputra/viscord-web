import { MessageStatus } from "@/enums/message-status.enum"
import { Attachment } from "./attachment"

export interface Message {
    id: string
    senderId: string
    content: string
    channelId: string
    isPinned: boolean
    createdAt: Date
    updatedAt: Date
    mentions: string[]
    attachments: Attachment[]
    clientId?: string
    status?: MessageStatus
}