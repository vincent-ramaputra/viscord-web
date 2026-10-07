
export interface CreateAttachmentDTO {
    files: {
        id: number;
        fileName: string;
        contentType: string;
        size: number;
    }[]
}