import { VOICE_RING_DISMISS_EVENT, VOICE_UPDATE_EVENT } from "@/constants/events";
import { useSocket } from "@/contexts/socket.context";
import { VoiceEventType } from "@/enums/voice-event-type";

interface VoiceEventsState {
    emitVoiceEvent: (channelId: string, type: VoiceEventType, data?: unknown) => void
}

export function useVoiceEvents(): VoiceEventsState {
    const { socket } = useSocket();

    const emitVoiceEvent = (channelId: string, type: VoiceEventType, data?: unknown) => {
        socket?.emit(VOICE_UPDATE_EVENT, { channelId, type, data });
    }

    return {
        emitVoiceEvent
    };
}

interface VoiceRingEventsState {
    emitDismissVoiceRing: (channelId: string, userId: string) => void
}

export function useVoiceRingEvents(): VoiceRingEventsState {
    const { socket } = useSocket();
    const emitDismissVoiceRing = (channelId: string, userId: string) => {
        socket?.emit(VOICE_RING_DISMISS_EVENT, { channelId, userId });
    }

    return {
        emitDismissVoiceRing
    }
}