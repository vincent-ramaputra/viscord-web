"use client"
import { useCurrentUserStore } from "@/app/stores/current-user-store";
import { api } from "@/services/api";
import { refreshToken } from "@/services/auth/auth.service";
import axios, { HttpStatusCode, type InternalAxiosRequestConfig } from "axios";
import { useRouter } from "next/navigation";
import { createContext, Dispatch, ReactNode, SetStateAction, useContext, useEffect, useRef, useState } from "react";

export interface AuthContextType {
    isAuthorized: boolean;
    handleRefreshToken: () => ReturnType<typeof refreshToken>;
}

const AuthContext = createContext<AuthContextType>(null!)

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const { isAuthorized } = useCurrentUserStore();
    const router = useRouter();


    const refreshInFlight = useRef<ReturnType<typeof refreshToken> | null>(null);

    const handleRefreshToken = () => {
        if (!refreshInFlight.current) {
            refreshInFlight.current = refreshToken().then(response => {
                const { setIsAuthorized } = useCurrentUserStore.getState();
                setIsAuthorized(response.success);
                if (!response.success) router.push('/login');
                return response;
            }).finally(() => {
                refreshInFlight.current = null;
            });
        }
        return refreshInFlight.current;
    };

    useEffect(() => {
        const refreshTokenInterceptor = api.interceptors.response.use(
            (response) => response,
            async (error: unknown) => {
                if (!axios.isAxiosError(error)) return Promise.reject(error);
                const config = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
                if (error.response?.status === HttpStatusCode.Unauthorized && config && !config._retry) {
                    config._retry = true;
                    const response = await handleRefreshToken();
                    if (!response.success) {
                        return Promise.reject(error);
                    }
                    return api.request(config);
                }

                return Promise.reject(error);
            });
        handleRefreshToken();

        return () => {
            api.interceptors.response.eject(refreshTokenInterceptor)
            // api.interceptors.request.eject(addIdentityInterceptor);
        }
    }, [])


    return (
        <AuthContext.Provider value={{ isAuthorized, handleRefreshToken }}>
            {children}
        </AuthContext.Provider>
    );
}