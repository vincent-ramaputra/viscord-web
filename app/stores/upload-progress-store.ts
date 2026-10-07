import { create } from "zustand";

interface UploadProgressStore {
    progressMap: Map<string, number>;
    getProgress: (key: string) => number | undefined;
    setProgress: (key: string, progress: number) => void;
    clearProgress: (keys: string[]) => void;
}

export const useUploadProgressStore = create<UploadProgressStore>((set, get) => {
    const getProgress = (key: string) => get().progressMap.get(key);
    const setProgress = (key: string, progress: number) => set(state => state.progressMap.get(key) === progress
        ? state
        : { progressMap: new Map(state.progressMap).set(key, progress) }
    );
    const clearProgress = (keys: string[]) => set(state => {
        if (!keys.some(k => state.progressMap.has(k))) return state;
        const newMap = new Map(state.progressMap);
        for (const key of keys) {
            newMap.delete(key);
        }

        return { progressMap: newMap };
    });

    return {
        progressMap: new Map(),
        getProgress,
        setProgress,
        clearProgress
    };
});