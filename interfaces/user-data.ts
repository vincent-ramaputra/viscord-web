import { UserProfile } from "./user-profile";

export interface UserData {
    id: string;

    email: string;

    dateOfBirth: string;

    profile: UserProfile;
}