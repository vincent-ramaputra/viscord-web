import { createContext, Dispatch, ReactNode, SetStateAction, useContext, useState } from "react";

interface AppStateContextType {
    isLoading: boolean
    setIsLoading: Dispatch<SetStateAction<boolean>>
}

const AppStateContext = createContext<AppStateContextType>(null!);

export function useAppState() {
    return useContext(AppStateContext);
}


export default function AppStateProvider({ children }: { children: ReactNode }) {
    const [isLoading, setIsLoading] = useState(true);


    return (
        <AppStateContext.Provider value={{ isLoading, setIsLoading }}>
            {children}
        </AppStateContext.Provider>
    )
}