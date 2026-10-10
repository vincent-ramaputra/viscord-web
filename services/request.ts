import { ApiError, Result } from "@/interfaces/result";
import { AxiosRequestConfig, isAxiosError } from "axios";
import { api } from "./api";

// The backend's `message` is a string, a string[] (Nest validation) or an object of field errors (auth-service).
// The body may not be our envelope at all (e.g. a proxy error page), so nothing here assumes its shape.
export function toApiError(error: unknown): ApiError {
    if (!isAxiosError(error)) return { message: 'Something went wrong' };
    if (!error.response) return { message: error.code === 'ECONNABORTED' ? 'Request timed out' : 'Network error' };

    const status = error.response.status;
    const body: unknown = error.response.data;
    const message = typeof body === 'object' && body !== null && 'message' in body ? body.message : undefined;

    if (typeof message === 'string') return { status, message };
    if (Array.isArray(message)) return { status, message: message.join(', ') };
    if (typeof message === 'object' && message !== null) {
        return { status, message: 'Some fields are invalid', errorFields: message as Record<string, string> };
    }
    return { status, message: `Request failed (${status})` };
}

// Never throws. Any 2xx is success; axios rejects everything else.
async function send<B, T>(config: AxiosRequestConfig, select: (body: B) => T): Promise<Result<T>> {
    try {
        const response = await api.request<B>(config);
        return { ok: true, data: select(response.data) };
    } catch (error) {
        return { ok: false, error: toApiError(error) };
    }
}

// NestJS services wrap the payload: { status, message, data }.
export function request<T>(config: AxiosRequestConfig): Promise<Result<T>> {
    return send<{ data: T }, T>(config, body => body?.data);
}

// message-service returns the payload itself, without the envelope.
export function requestRaw<T>(config: AxiosRequestConfig): Promise<Result<T>> {
    return send<T, T>(config, body => body);
}

// For React Query: turns a failed Result into a thrown Error so the mutation/query enters its error state.
export function unwrap<T>(result: Result<T>): T {
    if (!result.ok) throw new Error(result.error.message);
    return result.data;
}
