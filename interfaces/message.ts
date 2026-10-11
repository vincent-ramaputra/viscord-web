import { MessageDTO } from "./dto/message.dto"

export interface Message extends Omit<MessageDTO, 'createdAt' | 'updatedAt'> {
    createdAt: Date
    updatedAt: Date
}

export const toMessage = (dto: MessageDTO): Message => ({
    ...dto,
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt)
});