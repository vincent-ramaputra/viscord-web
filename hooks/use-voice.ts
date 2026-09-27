import { useAppSettingsStore } from "@/app/stores/app-settings-store";
import { useMediasoupStore } from "@/app/stores/mediasoup-store"
import { voiceSession } from "@/lib/voice/voice-session";

export function useVoice() {
    const channelId = useMediasoupStore((s) => s.channelId);
    const isMuted = useAppSettingsStore(s => s.mediaSettings.isMuted)
    const isDeafened = useAppSettingsStore(s => s.mediaSettings.isDeafened)
    // deafening also silences the mic without touching isMuted
    const isMicOff = isMuted || isDeafened;


    function join(channelId: string) {
        voiceSession.join(channelId).catch((error) => {
            console.error('Failed joining voice', error);
        });

    }

    function leave() {
        voiceSession.leave();
    }

    function toggleMute() {
        const { setMuted, mediaSettings } = useAppSettingsStore.getState();

        // flip what the user sees: clicking the mic while deafened turns it on (setMuted(false) also undeafens)
        setMuted(!(mediaSettings.isMuted || mediaSettings.isDeafened));
    }

    function toggleDeafened() {
        const { setDeafened, mediaSettings } = useAppSettingsStore.getState();

        setDeafened(!mediaSettings.isDeafened);
    }

    async function startScreenShare() {
        const { startScreenShare } = useMediasoupStore.getState();
        return await startScreenShare();
    }

    async function stopScreenShare() {
        const { stopScreenShare } = useMediasoupStore.getState();
        return await stopScreenShare();
    }

    return {
        channelId,
        isMuted,
        isDeafened,
        isMicOff,
        join,
        leave,
        toggleMute,
        toggleDeafened,
        startScreenShare,
        stopScreenShare
    };
}