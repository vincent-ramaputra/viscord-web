import { create } from "zustand";
import { Consumer, Producer } from "mediasoup-client/types";
import type { VoiceSessionStatus } from "@/lib/voice/voice-session";

interface MediasoupStoreState {
  channelId?: string;
  producers: Map<string, Producer>;
  consumers: Map<string, Consumer>;
  activeSpeakers: Map<string, boolean>;
  voiceStatus: VoiceSessionStatus,
  updateActiveSpeakers: (userId: string, isSpeaking: boolean) => void;
  setVoiceStatus: (status: VoiceSessionStatus, channelId?: string) => void;
  addProducer: (id: string, producer: Producer) => void;
  removeProducer: (producerId: string) => void;
  addConsumer: (consumerId: string, consumer: Consumer) => void;
  removeConsumer: (consumerId: string) => void;
  resetMedia: () => void;
}

export const useMediasoupStore = create<MediasoupStoreState>((set, get) => ({
  ready: false,
  channelId: undefined,
  producers: new Map(),
  consumers: new Map(),
  activeSpeakers: new Map(),
  voiceStatus: 'none',
  setVoiceStatus: (status, channelId) => { set({ voiceStatus: status, channelId }) },
  updateActiveSpeakers: (userId: string, isSpeaking: boolean) => {
    const map = new Map(get().activeSpeakers);
    if (isSpeaking) map.set(userId, true);
    else map.delete(userId);
    set({ activeSpeakers: map });
  },
  addProducer: (id, producer) => {
    const map = new Map(get().producers);
    map.set(id, producer);
    set({ producers: map });
  },
  removeProducer: (id) => {
    const map = new Map(get().producers);
    const producer = map.get(id);
    if (producer) {
      map.delete(id);
    }
    set({ producers: map });
  },
  addConsumer: (id, consumer) => {
    const map = new Map(get().consumers);
    map.set(id, consumer);
    set({ consumers: map });
  },
  removeConsumer: (id) => {
    const map = new Map(get().consumers);
    const consumer = map.get(id);
    if (consumer) {
      consumer.close();
      map.delete(id);
    }
    set({ consumers: map });
  },
  resetMedia: () => {
    set({producers: new Map(), consumers: new Map()});
  },
}));
