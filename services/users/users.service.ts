import { UserData } from "@/interfaces/user-data";
import { request } from "../request";

const ENDPOINT = `/users`

export const getCurrentUserData = () => request<UserData>({
    method: 'GET',
    url: `${ENDPOINT}/current`
});
