import Relationship from "@/interfaces/relationship";
import { request } from "../request";


const ENDPOINT = '/relationships';

export const getRelationships = () => request<Relationship[]>({
    method: 'GET',
    url: ENDPOINT
});

export const addFriend = (username: string) => request<Relationship>({
    method: 'POST',
    url: ENDPOINT,
    data: { username }
});

export const acceptFriendRequest = (relationshipId: string) => request<void>({
    method: 'PUT',
    url: `${ENDPOINT}/${relationshipId}`
});

export const declineFriendRequest = (relationshipId: string) => request<void>({
    method: 'DELETE',
    url: `${ENDPOINT}/${relationshipId}`
});
