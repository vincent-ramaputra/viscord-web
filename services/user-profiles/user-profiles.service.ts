import { UserStatus } from "@/enums/user-status.enum";
import { api } from "../api";
import { AxiosError, HttpStatusCode } from "axios";
import { UserData } from "@/interfaces/user-data";
import { Response } from "@/interfaces/response";
import { UserProfile } from "@/interfaces/user-profile";
import { UpdateUserProfileDto } from "@/interfaces/dto/update-user-profile.dto";

const ENDPOINT = '/user-profiles'

export async function updateStatus(status: UserStatus) {
    try {
        const response = await api.patch(ENDPOINT + '/status', { 
            status: status
        }, {
            withCredentials: true
        });
        if (response.status === HttpStatusCode.Ok) {
            return Response.Success<null>({
                data: response.data.data,
                message: response.data.message
            });
        }
        return Response.Failed<UserData>({
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

export async function updateUserProfile(dto: UpdateUserProfileDto): Promise<Response<UserProfile>> {
    try {
        const response = await api.patch(ENDPOINT, dto, {
            withCredentials: true
        });
        if (response.status === HttpStatusCode.Ok) {
            return Response.Success<UserProfile>({
                data: response.data.data,
                message: response.data.message
            });
        }
        return Response.Failed<UserProfile>({
            message: response.data.message
        });
    } catch (error) {
        if (error instanceof AxiosError)
            return Response.Failed<UserProfile>({
                message: error.response ? error.response.data.message as string : "An unknown Error occurred"
            });
    }

    return Response.Failed<UserProfile>({
        message: "An unknown error occurred."
    })
}