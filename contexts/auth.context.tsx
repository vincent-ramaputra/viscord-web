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
    const isAuthorized = useCurrentUserStore(s => s.isAuthorized);
    const router = useRouter();


    const handleRefreshToken = async () => {
        const { setIsAuthorized } = useCurrentUserStore.getState();
        const result = await refreshToken();
        if (!result.ok) {
            setIsAuthorized(false);
            router.push('/login');
            return result;
        }

        setIsAuthorized(true)
        return result;
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
                    const result = await handleRefreshToken();
                    if (!result.ok) {
                        return Promise.reject(error);
                    }
                    return api.request(config);
                }

                return Promise.reject(error);
            });
        handleRefreshToken();

        return () => {
            api.interceptors.response.eject(refreshTokenInterceptor)
        }
    }, [])


    return (
        <AuthContext.Provider value={{ isAuthorized, handleRefreshToken }}>
            {children}
        </AuthContext.Provider>
    );
}