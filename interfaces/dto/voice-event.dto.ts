import { VoiceEventType } from "@/enums/voice-event-type"
import { VoiceState } from "../voice-state"

export interface VoiceEventDTO {
    channelId: string
    userId: string
    type: VoiceEventType
    data?: Partial<VoiceState>
}

export type VoiceStateData = Pick<VoiceState, 'userId' | 'channelId' | 'isDeafened' | 'isMuted'>;

export type VoiceEventReceivedDTO =
    | { type: VoiceEventType.STATE_UPDATE | VoiceEventType.VOICE_JOIN, channelId: string, userId: string, data: VoiceStateData }
    | { type: VoiceEventType.VOICE_LEAVE, channelId: string, userId: string };