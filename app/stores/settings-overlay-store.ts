import { SettingsOverlayType } from "@/enums/settings-overlay-type.enum";
import { create } from "zustand";


interface SettingOverlaysDataMap {
    [SettingsOverlayType.CHANNEL_SETTINGS]: { channelId: string, guildId: string };
    [SettingsOverlayType.GUILD_SETTINGS]: { guildId: string };
    [SettingsOverlayType.SETTINGS]: never;
}

type SettingsOverlayMetadata = {
    [K in SettingsOverlayType]: {
        type: K;
        data: SettingOverlaysDataMap[K];
    }
}[SettingsOverlayType];

type SettingsOverlayArgs<T extends SettingsOverlayType> = [SettingOverlaysDataMap[T]] extends [never] ? [] : [data: SettingOverlaysDataMap[T]];


interface SettingsOverlayStore {
    metadata: SettingsOverlayMetadata | null;
    openSettings: <T extends SettingsOverlayType>(type: T, ...args: SettingsOverlayArgs<T>) => void;
    closeSettings: () => void;
}

export const useSettingsOverlay = create<SettingsOverlayStore>((set) => ({
    metadata: null,
    openSettings: <T extends SettingsOverlayType>(type: T, ...args: SettingsOverlayArgs<T>) => set({ metadata: { type, data: args[0] } as SettingsOverlayMetadata}),
    closeSettings: () => set({ metadata: null })
}));