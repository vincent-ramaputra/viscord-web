import axios from "axios";
import { LoginDTO } from "../../interfaces/dto/login.dto";
import { RegisterDTO } from "@/interfaces/dto/register.dto";
import { Result } from "@/interfaces/result";
import { api } from "../api";
import { request, toApiError } from "../request";

const ENDPOINT = '/auth';

export const login = (dto: LoginDTO) => request<void>({
    method: 'POST',
    url: `${ENDPOINT}/login`,
    data: dto
});

// Field-level validation errors come back in `error.errorFields`.
export const register = (dto: RegisterDTO) => request<void>({
    method: 'POST',
    url: `${ENDPOINT}/register`,
    data: dto
});

// Bare axios, not `api`: a refresh must not go through the 401 interceptor that calls it.
export async function refreshToken(): Promise<Result<string>> {
    try {
        const response = await axios.post(api.defaults.baseURL + ENDPOINT + '/refresh-token', null, {
            withCredentials: true,
            timeout: 10000
        });
        return { ok: true, data: response.data.data };
    } catch (error) {
        return { ok: false, error: toApiError(error) };
    }
}

export const logout = () => request<void>({
    method: 'POST',
    url: `${ENDPOINT}/logout`
});
