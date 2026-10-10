"use client"
import { useCurrentUserStore } from "@/app/stores/current-user-store";
import { api } from "@/services/api";
import { refreshToken } from "@/services/auth/auth.service";
import { HttpStatusCode, InternalAxiosRequestConfig, isAxiosError } from "axios";
import { useRouter } from "next/navigation";
import { createContext, ReactNode, useContext, useEffect } from "react";

export interface AuthContextType {
    isAuthorized: boolean;
    handleRefreshToken: () => void;
}

type RetryableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

const AuthContext = createContext<AuthContextType>(null!)

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const { isAuthorized } = useCurrentUserStore();
    const router = useRouter();


    const handleRefreshToken = async () => {
        const { setIsAuthorized } = useCurrentUserStore.getState();
        const response = await refreshToken();
        if (!response.success) {
            setIsAuthorized(false);
            router.push('/login');
            return response;
        }

        setIsAuthorized(true)
        return response;
    };

    useEffect(() => {
        const refreshTokenInterceptor = api.interceptors.response.use(
            (response) => response,
            async (error: unknown) => {
                if (!isAxiosError(error) || !error.config) {
                    return Promise.reject(error);
                }

                const config: RetryableRequestConfig = error.config;
                if (error.response?.status === HttpStatusCode.Unauthorized && !config._retry) {
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