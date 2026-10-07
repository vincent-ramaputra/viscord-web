
export interface CreateAttachmentResponseDTO {
    attachments: {
        id: number;
        key: string;
        uploadUrl: string;
        expiresAt: string;
    }[]
}