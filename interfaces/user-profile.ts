import { UserStatus } from "@/enums/user-status.enum";

export interface UserProfile {
    id: string;
    displayName: string;
    username: string;   
    pronouns?: string;
    bio?: string;
    status: UserStatus;
    avatarURL?: string;
    defaultAvatarURL: string;
    createdAt: string;
    updatedAt: string;
}