import { AxiosError, HttpStatusCode } from "axios";
import { api } from "../api";
import Relationship from "@/interfaces/relationship";
import { Response } from "@/interfaces/response";


const ENDPOINT = '/relationships';

export async function getRelationships(): Promise<Response<Relationship[]>> {
    try {
        const response = await api.get(ENDPOINT, {
            withCredentials: true
        });
        if (response.status === HttpStatusCode.Ok) {
            return Response.Success<Relationship[]>({
                data: response.data.data,
                message: response.data.message
            });
        }
        return Response.Failed<Relationship[]>({
            message: response.data.message
        });
    } catch (error) {
        if (error instanceof AxiosError)
            return Response.Failed<Relationship[]>({
                message: error.response ? error.response.data.message as string : "An unknown Error occurred"
            });
    }

    return Response.Failed<Relationship[]>({
        message: "An unknown error occurred."
    })
}

export async function addFriend(username: string): Promise<Response<Relationship>> {
    try {
        const response = await api.post(ENDPOINT, { username }, {
            withCredentials: true
        });
        if (response.status === HttpStatusCode.Ok) {
            return Response.Success<Relationship>({
                data: response.data.data,
                message: response.data.message
            });
        }
        return Response.Failed<Relationship>({
            message: response.data.message
        });
    } catch (error) {
        if (error instanceof AxiosError)
            return Response.Failed<Relationship>({
                message: error.response ? error.response.data.message as string : "An unknown Error occurred"
            });
    }

    return Response.Failed<Relationship>({
        message: "An unknown error occurred."
    })
}

export async function acceptFriendRequest(relationshipId: string): Promise<Response<null>> {
    try {
        const response = await api.put(`${ENDPOINT}/${relationshipId}`, null, {
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
    })
}

export async function declineFriendRequest(relationshipId: string): Promise<Response<null>> {
    try {
        const response = await api.delete(`${ENDPOINT}/${relationshipId}`, {
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
    })
}