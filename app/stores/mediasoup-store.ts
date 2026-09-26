import { create } from "zustand";
import { Device } from "mediasoup-client";
import { Consumer, Producer, Transport } from "mediasoup-client/types";
import { CLOSE_PRODUCER, PAUSE_CONSUMER, RESUME_CONSUMER } from "@/constants/events";
import { SfuClient } from "@/lib/voice/sfu-client";

interface MediasoupStoreState {
  ready: boolean;
  sfuClient?: SfuClient,
  device?: Device;
  channelId?: string;
  sendTransport?: Transport;
  recvTransport?: Transport;
  producers: Map<string, Producer>;
  consumers: Map<string, Consumer>;
  activeSpeakers: Map<string, boolean>;
  updateActiveSpeakers: (userId: string, isSpeaking: boolean) => void;
  setReady: (ready: boolean) => void;
  setSfuClient: (client: SfuClient) => void;
  setDevice: (device: Device, channelId: string) => void;
  setSendTransport: (transport: Transport) => void;
  setRecvTransport: (transport: Transport) => void;
  addProducer: (id: string, producer: Producer) => void;
  removeProducer: (consumerId: string) => void;
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
  updateActiveSpeakers: (userId: string, isSpeaking: boolean) => {
    const map = new Map(get().activeSpeakers);
    if (isSpeaking) map.set(userId, true);
    else map.delete(userId);
    set({ activeSpeakers: map });
  },
  setReady: (ready: boolean) => set({ ready }),
  setSfuClient: (client: SfuClient) => { set({ sfuClient: client }) },
  setDevice: (device, channelId) => set({ device, channelId }),
  setSendTransport: (transport) => set({ sendTransport: transport }),
  setRecvTransport: (transport) => set({ recvTransport: transport }),
  addProducer: (id, producer) => {
    const map = new Map(get().producers);
    map.set(id, producer);
    set({ producers: map });
  },
  removeProducer: (id) => {
    const map = new Map(get().producers);
    const producer = map.get(id);
    if (producer) {
      producer.close();
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
    const {sfuClient, consumers} = get();
    const consumer = consumers.get(consumerId);
    if (!consumer || !sfuClient) return;

    sfuClient.send(PAUSE_CONSUMER);
    consumer.pause();
  },
  resumeConsumer: (consumerId: string) => {
    const {sfuClient, consumers} = get();
    const consumer = consumers.get(consumerId);
    if (!consumer || !sfuClient) return;

    sfuClient.send(RESUME_CONSUMER);
    consumer.resume();
  },
  startScreenShare: async () => {
    const { sendTransport, addProducer, sfuClient, stopScreenShare, channelId } = get();
    if (!sendTransport || !sfuClient || !channelId) return false;
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        frameRate: 30,
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      },
      audio: true
    });

    const videoTrack = stream.getVideoTracks()[0];
    const producer = await sendTransport.produce({
      track: videoTrack,
      appData: {
        mediaTag: "screen"
      }
    });
    addProducer(producer.id, producer);

    videoTrack.onended = () => { stopScreenShare(); };
    return true;
  },
  stopScreenShare: async () => {
    const { producers, removeProducer, sfuClient } = get();
    const screenProducer = Array.from(producers.values()).find(p => p.appData?.mediaTag === 'screen');
    if (!screenProducer) return false;

    sfuClient?.send(CLOSE_PRODUCER, { producerId: screenProducer.id });

    removeProducer(screenProducer.id);
    screenProducer.close();

    return true;
  },
  cleanup: async () => {
    await get().stopScreenShare();
    get().producers.forEach((p) => p.close());
    get().consumers.forEach((c) => c.close());
    get().sendTransport?.close();
    get().recvTransport?.close();
    get().sfuClient?.close();
    set({
      sfuClient: undefined,
      device: undefined,
      sendTransport: undefined,
      recvTransport: undefined,
      producers: new Map(),
      consumers: new Map(),
      channelId: undefined
    });
  },
}));
