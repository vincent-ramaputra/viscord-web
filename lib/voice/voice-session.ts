import { SfuClient } from "./sfu-client";
import { VoiceEventDTO } from "@/interfaces/dto/voice-event.dto";
import { MediaSession } from "./media-session";
import { VoiceEventType } from "@/enums/voice-event-type";
import { Consumer, Producer } from "mediasoup-client/types";
import { createVoiceTicket } from "@/services/channels/channels.service";
import { useSocketStore } from "@/app/stores/socket-store";
import { VOICE_UPDATE_EVENT } from "@/constants/events";
import { useAppSettingsStore } from "@/app/stores/app-settings-store";
import { useCurrentUserStore } from "@/app/stores/current-user-store";
import { useMediasoupStore } from "@/app/stores/mediasoup-store";

export type VoiceSessionStatus = 'none' | 'connecting' | 'connected';

interface VoiceSessionDeps {
    getUserId(): string | undefined;
    createTicket(channelId: string): Promise<{ ticket: string, sfuUrl: string }>;
    createSfuClient(sfuUrl: string, ticket: string): SfuClient;
    emitGateway(event: Omit<VoiceEventDTO, 'userId'>): void;
    getMicTrack(): Promise<MediaStreamTrack>;
    getMediaSettings(): { isMuted: boolean, isDeafened: boolean };
    store: {
        addConsumer(consumer: Consumer): void;
        removeConsumer(consumerId: string): void;
        addProducer(producer: Producer): void;
        removeProducer(producerId: string): void;
        setSfuClient(sfuClient?: SfuClient): void
        setMediaSession(mediaSession?: MediaSession): void;
        setVoice: (status: VoiceSessionStatus, channelId?: string) => void;
        resetMedia: () => void;
    };
}

export class VoiceSession {
    private channelId?: string;
    private sfuClient?: SfuClient;
    private mediaSession?: MediaSession;

    private attempt = 0;
    private status: VoiceSessionStatus = 'none';

    constructor(private readonly deps: VoiceSessionDeps) {

    }

    async join(channelId: string) {
        if (channelId === this.channelId && this.status !== 'none') return;
        if (this.channelId) await this.leave();

        this.channelId = channelId;
        this.setStatus('connecting');
        const attemptNumber = ++this.attempt;

        let sfu: SfuClient | undefined;
        try {
            const ticketResponse = await this.deps.createTicket(channelId);
            if (attemptNumber !== this.attempt) return;

            sfu = this.deps.createSfuClient(ticketResponse.sfuUrl, ticketResponse.ticket);
            await sfu.connect();
            if (attemptNumber !== this.attempt) {
                sfu.close();
                return;
            }

            this.sfuClient = sfu;
            this.deps.store.setSfuClient(sfu);

            const userId = this.deps.getUserId();
            if (!userId) throw new Error('Not logged in');

            const mediaSession = await MediaSession.start(sfu, { userId, channelId }, {
                onConsumerAdded: (consumer) => this.deps.store.addConsumer(consumer),
                onConsumerRemoved: (consumerId) => this.deps.store.removeConsumer(consumerId),
                onProducerAdded: (producer) => this.deps.store.addProducer(producer),
                onProducerRemoved: (producerId) => this.deps.store.removeProducer(producerId)
            });
            if (attemptNumber !== this.attempt) {
                mediaSession.close();
                sfu.close();
                return;
            }
            this.mediaSession = mediaSession;
            this.deps.store.setMediaSession(mediaSession);

            const mediaSettings = this.deps.getMediaSettings();
            let track: MediaStreamTrack | undefined;
            try {
                track = await this.deps.getMicTrack();
                if (attemptNumber !== this.attempt) {
                    track.stop();
                    return;
                }
                await mediaSession.produceMic(track, { paused: mediaSettings.isMuted || mediaSettings.isDeafened });

                // await startVAD();
            } catch (error) {
                track?.stop();
                if (attemptNumber !== this.attempt) return;
                console.error("Failed getting audio input", error);

            }

            this.deps.emitGateway({
                type: VoiceEventType.VOICE_JOIN,
                channelId,
                data: {
                    isMuted: mediaSettings.isMuted || mediaSettings.isDeafened,
                    isDeafened: mediaSettings.isDeafened
                }
            });
            this.setStatus('connected');

        } catch (error) {
            sfu?.close();
            if (attemptNumber !== this.attempt) return;
            console.error('Failed connecting to SFU Server', error);

            this.teardown();

            throw error;
        }
    }

    async leave() {
        ++this.attempt;

        if (this.status == 'connected' && this.channelId) {
            this.deps.emitGateway({
                type: VoiceEventType.VOICE_LEAVE,
                channelId: this.channelId,
            });
        }

        this.teardown();
    }

    private teardown() {
        this.mediaSession?.close();
        this.sfuClient?.close();
        this.channelId = undefined;
        this.sfuClient = undefined;
        this.mediaSession = undefined;

        this.deps.store.setMediaSession(undefined)
        this.deps.store.setSfuClient(undefined)
        this.deps.store.resetMedia();

        this.setStatus('none');
    }

    private setStatus(status: VoiceSessionStatus) {
        this.status = status;
        this.deps.store.setVoice(status, this.channelId);
    }
}

export const voiceSession = new VoiceSession({
    createSfuClient: (sfuUrl, ticket) => {
        return new SfuClient(sfuUrl, ticket);
    },
    createTicket: async (channelId) => {
        const response = await createVoiceTicket(channelId);

        if (!response.success || !response.data) throw new Error(typeof response.message === 'string' ? response.message : 'Failed creating ticket');

        return response.data;
    },
    emitGateway: (event) => {
        const socket = useSocketStore.getState().socket;

        socket?.emit(VOICE_UPDATE_EVENT, event);
    },
    getMediaSettings: () => {
        const { isMuted, isDeafened } = useAppSettingsStore.getState().mediaSettings;
        return { isMuted, isDeafened };
    },
    getMicTrack: async () => {
        const inputId = useAppSettingsStore.getState().mediaSettings.audioInputDeviceId;
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                deviceId: inputId ? { ideal: inputId } : undefined,
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            }
        });

        const [track] = stream.getAudioTracks();
        if (!track) {
            throw new Error('No audio track found in stream');
        }

        return track;
    },
    getUserId: () => {
        const { user } = useCurrentUserStore.getState();

        return user?.id;
    },
    store: {
        addConsumer: (consumer) => {
            const { addConsumer } = useMediasoupStore.getState();
            addConsumer(consumer.id, consumer);
        },
        addProducer: (producer) => {
            const { addProducer } = useMediasoupStore.getState();
            addProducer(producer.id, producer);
        },
        removeConsumer: (consumerId) => {
            const { removeConsumer } = useMediasoupStore.getState();
            removeConsumer(consumerId);
        },
        removeProducer: (producerId) => {
            const { removeProducer } = useMediasoupStore.getState();
            removeProducer(producerId);
        },
        setMediaSession: (session) => {
            const { setMediaSession } = useMediasoupStore.getState();
            setMediaSession(session)
        },
        setSfuClient: (sfu) => {
            const { setSfuClient } = useMediasoupStore.getState();
            setSfuClient(sfu);
        },
        setVoice: (status, channelId) => {
            const { setVoiceStatus } = useMediasoupStore.getState();
            setVoiceStatus(status, channelId);
        },
        resetMedia: () => {
            const { resetMedia } = useMediasoupStore.getState();
            resetMedia();
        }
    }
})