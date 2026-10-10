export interface ApiError {
    status?: number;
    message: string;
    errorFields?: Record<string, string>;
}

export type Result<T> = {ok: true, data: T} | {ok: false, error: ApiError}