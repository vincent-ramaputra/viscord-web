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


    function join(channelId: string) {
        const { isDeafened, isMuted } = useAppSettingsStore.getState().mediaSettings;

        emitVoiceEvent(channelId, VoiceEventType.VOICE_JOIN, {
            isMuted,
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

        setMuted(!mediaSettings.isMuted);
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
        join,
        leave,
        toggleMute,
        toggleDeafened,
        startScreenShare,
        stopScreenShare
    };
}