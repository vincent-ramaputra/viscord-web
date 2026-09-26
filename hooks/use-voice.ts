import { useVoiceEvents } from "@/app/(auth)/hooks/socket-events";
import { useAppSettingsStore } from "@/app/stores/app-settings-store";
import { useMediasoupStore } from "@/app/stores/mediasoup-store"
import { VoiceEventType } from "@/enums/voice-event-type";
import { VoiceState } from "@/interfaces/voice-state";

export function useVoice() {
    const { emitVoiceEvent } = useVoiceEvents();
    const channelId = useMediasoupStore((s) => s.channelId);
    const isMuted = useAppSettingsStore(s => s.mediaSettings.isMuted)
    const isDeafened = useAppSettingsStore(s => s.mediaSettings.isDeafened)
    // deafening also silences the mic without touching isMuted
    const isMicOff = isMuted || isDeafened;


    function join(channelId: string) {
        const { isDeafened, isMuted } = useAppSettingsStore.getState().mediaSettings;

        emitVoiceEvent(channelId, VoiceEventType.VOICE_JOIN, {
            isMuted: isMuted || isDeafened,
            isDeafened
        } as VoiceState);
    }

    function leave() {
        const { channelId } = useMediasoupStore.getState();
        if (!channelId) return;

        emitVoiceEvent(channelId, VoiceEventType.VOICE_LEAVE);
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