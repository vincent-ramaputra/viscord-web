import { AxiosError, HttpStatusCode } from "axios";
import { api } from "../api";
import { Message } from "@/interfaces/message";
import { Response } from "@/interfaces/response";
import { CreateMessageDto } from "@/interfaces/dto/create-message.dto";
import { CreateAttachmentResponseDTO } from "@/interfaces/dto/create-attachment-response.dto";
import { CreateAttachmentDTO } from "@/interfaces/dto/create-attachment.dto";

// message-service returns the message(s) directly, not wrapped in the
// { status, message, data } envelope the NestJS services use.
const messagePath = (channelId: string, ...segments: string[]) => {
    return `/channels/${channelId}/messages${segments.length ? '/' + segments.join('/') : ''}`;
}

const attachmentPath = (channelId: string) => `/channels/${channelId}/attachments`

export async function getMessages(channelId: string): Promise<Response<Message[]>> {
    try {
        const response = await api.get(messagePath(channelId), {
            withCredentials: true
        });
        if (response.status === HttpStatusCode.Ok) {
            return Response.Success<Message[]>({
                data: response.data,
                message: ''
            });
        }
        return Response.Failed<Message[]>({
            message: response.data.message
        });
    } catch (error) {
        if (error instanceof AxiosError)
            return Response.Failed<Message[]>({
                message: error.response ? error.response.data.message as string : "An unknown Error occurred"
            });
    }

    return Response.Failed<Message[]>({
        message: "An unknown error occurred."
    })
}

export async function sendMessage(dto: CreateMessageDto): Promise<Response<Message>> {
    try {
        const response = await api.post(messagePath(dto.channelId), dto, {
            withCredentials: true
        });
        if (response.status === HttpStatusCode.Created) {
            return Response.Success<Message>({
                data: response.data,
                message: ''
            });
        }
        return Response.Failed<Message>({
            message: response.data.message
        });
    } catch (error) {
        if (error instanceof AxiosError)
            return Response.Failed<Message>({
                message: error.response ? error.response.data.message as string : "An unknown Error occurred"
            });
    }

    return Response.Failed<Message>({
        message: "An unknown error occurred."
    })
}

export async function acknowledgeMessage(channelId: string, messageId: string) {
    console.log('yeehaw');
    try {
        const response = await api.post(messagePath(channelId, messageId, 'ack'), null, {
            withCredentials: true
        });
        if (response.status === HttpStatusCode.NoContent) {
            return Response.Success<null>({
                data: response.data.data,
                message: response.data.message
            });
        }
        return Response.Failed<null>({
            message: response.data.message
        });
    } catch (error) {
        if (error instanceof AxiosError)
            return Response.Failed<null>({
                message: error.response ? error.response.data.message as string : "An unknown Error occurred"
            });
    }

    return Response.Failed<null>({
        message: "An unknown error occurred."
    });

}

export async function createAttachment(channelId: string, files: CreateAttachmentDTO) : Promise<Response<CreateAttachmentResponseDTO>> {
     try {
        const response = await api.post(attachmentPath(channelId), files, {
            withCredentials: true
        });
        if (response.status === HttpStatusCode.Ok) {
            return Response.Success({
                data: response.data,
                message: response.data.message
            });
        }
        return Response.Failed({
            message: response.data.message
        });
    } catch (error) {
        if (error instanceof AxiosError)
            return Response.Failed({
                message: error.response ? error.response.data.message as string : "An unknown Error occurred"
            });
    }

    return Response.Failed({
        message: "An unknown error occurred."
    });   
}
