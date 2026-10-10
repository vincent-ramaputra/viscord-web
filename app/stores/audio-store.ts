import { create } from "zustand";


export type SoundType = 'ring' | 'message' | 'mention' | 'call' | 'voice-leave' | 'voice-join' | 'audio-test'

interface AudioStore {
  playSound: (type: SoundType) => void;
  stopSound: (type: SoundType) => void;
}

export const useAudioStore = create<AudioStore>(() => ({
  playSound: () => {},
  stopSound: () => {},
}));

export const playSound = (type: SoundType) => {
  useAudioStore.getState().playSound(type);
}

export const stopSound = (type: SoundType) => {
  useAudioStore.getState().stopSound(type);
}