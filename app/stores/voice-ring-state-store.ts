import { VoiceRingState } from "@/interfaces/voice-ring-state";
import { create } from "zustand";

type VoiceRingMap = Map<string, VoiceRingState>

interface VoiceRingStoreState {
    voiceRingStates: Map<string, VoiceRingState>;
    setVoiceRingStates: (voiceRingStates: VoiceRingMap) => void;
    updateVoiceRingState: (state: VoiceRingState) => void;
    removeVoiceRingState: (channelId: string, recipientId: string) => void;
    batchUpdateVoiceRingState: (state: VoiceRingState[]) => void;
}

export const useVoiceRingStateStore = create<VoiceRingStoreState>((set) => ({
    voiceRingStates: new Map(),
    setVoiceRingStates: (voiceRingStates: VoiceRingMap) => set({ voiceRingStates }),
    updateVoiceRingState: (voiceRingState: VoiceRingState) => {
        set(state => {
            const newVoiceRings = new Map(state.voiceRingStates);
            newVoiceRings.set(getVoiceRingKey(voiceRingState.channelId, voiceRingState.recipientId), voiceRingState)

            return { voiceRingStates: newVoiceRings }
        })
    },
    removeVoiceRingState: (channelId: string, recipientId: string) => {
        set(state => {
            const newVoiceRings = new Map(state.voiceRingStates);
            const key = getVoiceRingKey(channelId, recipientId);
            const vs = newVoiceRings.get(key);
            if (vs) {
                newVoiceRings.delete(key);
            }

            return { voiceRingStates: newVoiceRings };
        })
    },
    batchUpdateVoiceRingState: (states: VoiceRingState[]) => {
        set(state => {
            const newVoiceRings = new Map(state.voiceRingStates);
            for (const voiceRingState of states) {
                newVoiceRings.set(getVoiceRingKey(voiceRingState.channelId, voiceRingState.recipientId), voiceRingState)
            }

            return { voiceRingStates: newVoiceRings }
        })
    }
}))

export function getVoiceRingKey(channelId: string, recipientId: string) {
    return `${channelId}:${recipientId}`
}