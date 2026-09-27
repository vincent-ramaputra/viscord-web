import { create } from "zustand";
import { Device } from "mediasoup-client";
import { Consumer, Producer, Transport } from "mediasoup-client/types";
import { CLOSE_PRODUCER, PAUSE_CONSUMER, RESUME_CONSUMER } from "@/constants/events";
import { SfuClient } from "@/lib/voice/sfu-client";
import { MediaSession } from "@/lib/voice/media-session";

interface MediasoupStoreState {
  ready: boolean;
  sfuClient?: SfuClient,
  mediaSession?: MediaSession;
  channelId?: string;
  producers: Map<string, Producer>;
  consumers: Map<string, Consumer>;
  activeSpeakers: Map<string, boolean>;
  updateActiveSpeakers: (userId: string, isSpeaking: boolean) => void;
  setReady: (ready: boolean) => void;
  setSfuClient: (client: SfuClient) => void;
  setMediaSession: (session: MediaSession, channelId: string) => void;
  addProducer: (id: string, producer: Producer) => void;
  removeProducer: (producerId: string) => void;
  addConsumer: (consumerId: string, consumer: Consumer) => void;
  removeConsumer: (consumerId: string) => void;
  startScreenShare: () => Promise<boolean>;
  stopScreenShare: () => Promise<boolean>;
  resumeConsumer: (consumerId: string) => void;
  pauseConsumer: (consumerId: string) => void;
  cleanup: () => Promise<void>;
}

export const useMediasoupStore = create<MediasoupStoreState>((set, get) => ({
  ready: false,
  sfuClient: undefined,
  device: undefined,
  channelId: undefined,
  sendTransport: undefined,
  recvTransport: undefined,
  producers: new Map(),
  consumers: new Map(),
  activeSpeakers: new Map(),
  mediaSession: undefined,
  updateActiveSpeakers: (userId: string, isSpeaking: boolean) => {
    const map = new Map(get().activeSpeakers);
    if (isSpeaking) map.set(userId, true);
    else map.delete(userId);
    set({ activeSpeakers: map });
  },
  setReady: (ready: boolean) => set({ ready }),
  setSfuClient: (client: SfuClient) => { set({ sfuClient: client }) },
  setMediaSession: (session: MediaSession, channelId: string) => { set({ mediaSession: session, channelId }) },
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
  pauseConsumer: (consumerId: string) => {
    const { sfuClient, consumers } = get();
    const consumer = consumers.get(consumerId);
    if (!consumer || !sfuClient) return;

    sfuClient.send(PAUSE_CONSUMER);
    consumer.pause();
  },
  resumeConsumer: (consumerId: string) => {
    const { sfuClient, consumers } = get();
    const consumer = consumers.get(consumerId);
    if (!consumer || !sfuClient) return;

    sfuClient.send(RESUME_CONSUMER);
    consumer.resume();
  },
  startScreenShare: async () => {
    const { mediaSession, sfuClient, stopScreenShare, channelId } = get();
    if (!mediaSession || !sfuClient || !channelId) return false;
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        frameRate: 30,
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      },
      audio: true
    });

    const videoTrack = stream.getVideoTracks()[0];

    await mediaSession.produceScreen(videoTrack);

    videoTrack.onended = () => { stopScreenShare(); };
    return true;
  },
  stopScreenShare: async () => {
    const { producers, removeProducer, mediaSession } = get();
    const screenProducer = Array.from(producers.values()).find(p => p.appData?.mediaTag === 'screen');
    if (!screenProducer || !mediaSession) return false;

    mediaSession.closeProducer(screenProducer.id);

    return true;
  },
  cleanup: async () => {
    const { stopScreenShare, sfuClient, mediaSession } = get();

    await stopScreenShare();
    mediaSession?.close();
    sfuClient?.close();

    set({
      sfuClient: undefined,
      mediaSession: undefined,
      producers: new Map(),
      consumers: new Map(),
      channelId: undefined
    });
  },
}));
