import { UserStatus } from "@/enums/user-status.enum";
import { UserProfile } from "@/interfaces/user-profile";
import { UpdateUserProfileDto } from "@/interfaces/dto/update-user-profile.dto";
import { request } from "../request";

const ENDPOINT = '/user-profiles'

export const updateStatus = (status: UserStatus) => request<void>({
    method: 'PATCH',
    url: `${ENDPOINT}/status`,
    data: { status }
});

export const updateUserProfile = (dto: UpdateUserProfileDto) => request<UserProfile>({
    method: 'PATCH',
    url: ENDPOINT,
    data: dto
});
