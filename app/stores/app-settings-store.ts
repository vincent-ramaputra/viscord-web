import { MAX_VOLUME, MIN_VOLUME } from "@/constants/app-config"
import { create } from "zustand"
import { playSound } from "./audio-store"

interface MediaSettings {
    isMuted: boolean
    isDeafened: boolean
    audioInputDeviceId: string | undefined
    audioOutputDeviceId: string | undefined
    inputVolume: number
    outputVolume: number
}

interface AppSettings {
    mediaSettings: MediaSettings,
    setAudioOutputDevice: (deviceId: string) => void,
    setAudioInputDevice: (deviceId: string) => void,
    setInputVolume: (volume: number) => void,
    setOutputVolume: (volume: number) => void,
    setMuted: (muted: boolean) => void,
    setDeafened: (deafened: boolean) => void
}

const defaultMediaSettings: MediaSettings = {
    isMuted: false,
    isDeafened: false,
    audioInputDeviceId: undefined,
    audioOutputDeviceId: undefined,
    inputVolume: MAX_VOLUME,
    outputVolume: MAX_VOLUME
};

export const useAppSettingsStore = create<AppSettings>((set) => {
    const storedMediaSetting = typeof window !== 'undefined' ? localStorage.getItem("media_settings") : null;
    const initial = storedMediaSetting ? JSON.parse(storedMediaSetting) as MediaSettings : defaultMediaSettings;

    return {
        mediaSettings: initial,
        setAudioOutputDevice: (deviceId: string) => {
            set(state => {
                const newMediaSettings: MediaSettings = { ...state.mediaSettings, audioOutputDeviceId: deviceId };
                if (typeof window !== undefined) localStorage.setItem('media_settings', JSON.stringify(newMediaSettings))
                return { mediaSettings: newMediaSettings }
            });
            playSound('audio-test');
        },
        setAudioInputDevice: (deviceId: string) => {
            set(state => {
                const newMediaSettings: MediaSettings = { ...state.mediaSettings, audioInputDeviceId: deviceId };
                localStorage.setItem('media_settings', JSON.stringify(newMediaSettings))
                return { mediaSettings: newMediaSettings }
            });
        },
        setInputVolume: (volume: number) => {
            set(state => {
                const newVol = volume < MIN_VOLUME ? MIN_VOLUME : volume > MAX_VOLUME ? MAX_VOLUME : volume;
                const newMediaSettings: MediaSettings = { ...state.mediaSettings, inputVolume: newVol };
                localStorage.setItem('media_settings', JSON.stringify(newMediaSettings))
                return { mediaSettings: newMediaSettings }
            });
        },
        setOutputVolume: (volume: number) => {
            set(state => {
                const newVol = volume < MIN_VOLUME ? MIN_VOLUME : volume > MAX_VOLUME ? MAX_VOLUME : volume;
                const newMediaSettings: MediaSettings = { ...state.mediaSettings, outputVolume: newVol };
                localStorage.setItem('media_settings', JSON.stringify(newMediaSettings))
                return { mediaSettings: newMediaSettings }
            });
        },
        setMuted: (muted: boolean) => {
            set(state => {
                const newMediaSettings: MediaSettings = { ...state.mediaSettings, isMuted: muted }
                if (!muted) newMediaSettings.isDeafened = false;

                localStorage.setItem('media_settings', JSON.stringify(newMediaSettings))

                return { mediaSettings: newMediaSettings }
            })
        },
        setDeafened: (deafened: boolean) => {
            // isMuted is left untouched so undeafening restores it; the mic is off while isMuted || isDeafened
            set(state => {
                const newMediaSettings: MediaSettings = { ...state.mediaSettings, isDeafened: deafened };

                localStorage.setItem('media_settings', JSON.stringify(newMediaSettings));
                return { mediaSettings: newMediaSettings };
            })
        }
    };
});


