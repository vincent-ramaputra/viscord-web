import { SfuClient } from "./sfu-client";
import { VoiceEventDTO } from "@/interfaces/dto/voice-event.dto";
import { MediaSession } from "./media-session";
import { VoiceEventType } from "@/enums/voice-event-type";
import { Consumer, Producer } from "mediasoup-client/types";
import { createVoiceTicket } from "@/services/channels/channels.service";
import { useSocketStore } from "@/app/stores/socket-store";
import { ACTIVE_SPEAKER_STATE, VOICE_UPDATE_EVENT } from "@/constants/events";
import { useAppSettingsStore } from "@/app/stores/app-settings-store";
import { useCurrentUserStore } from "@/app/stores/current-user-store";
import { useMediasoupStore } from "@/app/stores/mediasoup-store";
import { LocalAudio, LocalAudioDeps } from "./local-audio";
import { VoiceState } from "@/interfaces/voice-state";
import { ActiveSpeakerStateDTO } from "@/interfaces/dto/active-speaker-state.dto";

export type VoiceSessionStatus = 'none' | 'connecting' | 'reconnecting' | 'connected';

const RETRY_BASE_DELAY = 2000;
const MAX_DELAY = 8000;
const MAX_RETRIES = 5;

interface VoiceSessionDeps {
    getUserId(): string | undefined;
    createTicket(channelId: string): Promise<{ ticket: string, sfuUrl: string }>;
    createSfuClient(sfuUrl: string, ticket: string): SfuClient;
    startLocalAudio(deviceId: string | undefined, deps: LocalAudioDeps): Promise<LocalAudio>;
    emitGateway(event: Omit<VoiceEventDTO, 'userId'>): void;
    getMediaSettings(): { isMuted: boolean, isDeafened: boolean, audioInputDeviceId: string | undefined };
    onInputDeviceChange: (listener: (deviceId: string | undefined) => void) => () => void;
    onMicOffChange: (listener: (micOff: boolean) => void) => () => void;
    onSetDeafened: (listener: (deafened: boolean) => void) => () => void;
    getScreenTrack(): Promise<MediaStreamTrack>;
    random(): number;
    sleep(ms: number): Promise<void>;
    store: {
        addConsumer(consumer: Consumer): void;
        removeConsumer(consumerId: string): void;
        addProducer(producer: Producer): void;
        removeProducer(producerId: string): void;
        setVoice: (status: VoiceSessionStatus, channelId?: string) => void;
        resetMedia: () => void;
        setActiveSpeaker(userId: string, speaking: boolean): void;
    };
}

export class VoiceSession {
    private channelId?: string;
    private sfuClient?: SfuClient;
    private mediaSession?: MediaSession;
    private localAudio?: LocalAudio;

    private attempt = 0;
    private status: VoiceSessionStatus = 'none';

    private callUnsubscribes: Array<() => void> = [];
    private connectionUnsubscribes: Array<() => void> = [];

    constructor(private readonly deps: VoiceSessionDeps) {

    }

    async join(channelId: string) {
        if (channelId === this.channelId && this.status !== 'none') return;
        if (this.channelId) await this.leave();

        this.channelId = channelId;
        this.setStatus('connecting');

        const attemptNumber = ++this.attempt;
        let localAudio: LocalAudio | undefined;
        try {
            const mediaSettings = this.deps.getMediaSettings();
            localAudio = await this.deps.startLocalAudio(mediaSettings.audioInputDeviceId, {
                isMicOff: () => { const s = this.deps.getMediaSettings(); return s.isMuted || s.isDeafened; },
                onSpeakingChange: this.onSpeakingChange,
            })
            if (attemptNumber !== this.attempt) {
                localAudio.stop();
                return;
            }

            this.localAudio = localAudio;
        } catch (error) {
            localAudio?.stop();
            if (attemptNumber !== this.attempt) return;
            console.error("Failed getting audio input", error);
        }

        try {
            await this.connect(channelId, attemptNumber);

            this.callUnsubscribes.push(
                this.deps.onInputDeviceChange(this.switchInputDevice),
                this.deps.onMicOffChange(this.onMicOffChange),
                this.deps.onSetDeafened(this.onDeafenedChange),
            );

            this.setStatus('connected');

            const mediaSettings = this.deps.getMediaSettings();
            this.deps.emitGateway({
                type: VoiceEventType.VOICE_JOIN,
                channelId,
                data: {
                    isMuted: mediaSettings.isMuted || mediaSettings.isDeafened,
                    isDeafened: mediaSettings.isDeafened
                }
            });

        } catch (error) {
            if (attemptNumber !== this.attempt) return;
            console.error('Failed connecting to SFU Server', error);

            this.teardown();

            throw error;
        }
    }

    private async connect(channelId: string, attempt: number) {
        let sfu: SfuClient | undefined;

        try {
            const ticketResponse = await this.deps.createTicket(channelId);
            if (attempt !== this.attempt) throw new Error("Connection closed");

            sfu = this.deps.createSfuClient(ticketResponse.sfuUrl, ticketResponse.ticket);
            await sfu.connect();
            if (attempt !== this.attempt) {
                sfu.close();
                throw new Error("Connection closed");
            }

            this.sfuClient = sfu;

            const userId = this.deps.getUserId();
            if (!userId) throw new Error('Not logged in');

            let mediaSettings = this.deps.getMediaSettings();
            const mediaSession = await MediaSession.start(sfu, { userId, channelId, audioProducerPaused: mediaSettings.isDeafened || mediaSettings.isMuted, audioConsumerPaused: mediaSettings.isDeafened }, {
                onConsumerAdded: (consumer) => this.deps.store.addConsumer(consumer),
                onConsumerRemoved: (consumerId) => this.deps.store.removeConsumer(consumerId),
                onProducerAdded: (producer) => this.deps.store.addProducer(producer),
                onProducerRemoved: (producerId) => this.deps.store.removeProducer(producerId)
            });
            if (attempt !== this.attempt) {
                mediaSession.close();
                sfu.close();
                throw new Error("Connection closed");
            }
            this.mediaSession = mediaSession;

            this.connectionUnsubscribes.push(
                sfu.on(ACTIVE_SPEAKER_STATE, this.onActiveSpeaker),
            );

            mediaSettings = this.deps.getMediaSettings();
            mediaSession.setAudioConsumerPaused(mediaSettings.isDeafened);
            mediaSession.setMicPaused(mediaSettings.isMuted || mediaSettings.isDeafened);

            if (this.localAudio) {
                try {
                    await mediaSession.produceMic(this.localAudio.track);
                } catch (error) {
                    if (this.attempt !== attempt) throw new Error("Connection closed");
                    console.error("Mic unavailable", error);
                }
            }

            this.connectionUnsubscribes.push(
                sfu.onDisconnect((reason) => {
                    if (reason === 'io client disconnect') return;
                    this.reconnect();
                })
            );
        } catch (error) {
            sfu?.close();
            throw error;
        }

    }

    private async reconnect() {
        if (!this.channelId) return;
        const attempt = ++this.attempt;
        this.setStatus('reconnecting');


        for (let retryCount = 0; retryCount < MAX_RETRIES; ++retryCount) {
            this.resetConnection();

            const waitTime = Math.min(RETRY_BASE_DELAY * 2 ** retryCount, MAX_DELAY);
            const jitter = waitTime * 0.3 * this.deps.random();

            await this.deps.sleep(waitTime + jitter);
            if (attempt !== this.attempt) return;

            try {
                await this.connect(this.channelId, attempt);
                if (attempt !== this.attempt) return;

                this.setStatus('connected');
                return;
            } catch (error) {
                if (attempt !== this.attempt) return;
                console.error(`Voice reconnection attempt ${retryCount + 1}/${MAX_RETRIES} failed`, error);
            }
        }

        await this.leave();
    }

    async leave() {
        ++this.attempt;

        if ((this.status === 'connected' || this.status === 'reconnecting') && this.channelId) {
            this.deps.emitGateway({
                type: VoiceEventType.VOICE_LEAVE,
                channelId: this.channelId,
            });
        }

        this.teardown();
    }

    private switchInputDevice = async (deviceId?: string) => {
        if (!this.localAudio) return;
        try {
            const track = await this.localAudio.switchDevice(deviceId);
            await this.mediaSession?.replaceMicTrack(track);
        } catch (error) {
            console.error('Error switching input device', error)
        }
    }

    private onSpeakingChange = (speaking: boolean) => {
        const userId = this.deps.getUserId();
        if (!userId) return;

        this.deps.store.setActiveSpeaker(userId, speaking);
        this.sfuClient?.send(ACTIVE_SPEAKER_STATE, { speaking });
    }

    private onMicOffChange = (micOff: boolean) => {
        const channelId = this.channelId;
        if (!channelId) return;

        this.mediaSession?.setMicPaused(micOff);
        this.deps.emitGateway({
            type: VoiceEventType.STATE_UPDATE,
            channelId,
            data: {
                isMuted: micOff
            } as VoiceState
        });
    }

    private onDeafenedChange = (deafened: boolean) => {
        const channelId = this.channelId;
        if (!channelId) return;

        this.mediaSession?.setAudioConsumerPaused(deafened);
        this.deps.emitGateway({
            type: VoiceEventType.STATE_UPDATE,
            channelId,
            data: {
                isDeafened: deafened
            } as VoiceState
        });
    }

    private onActiveSpeaker = (dto: ActiveSpeakerStateDTO) => {
        this.deps.store.setActiveSpeaker(dto.userId, dto.speaking);
    }

    startScreenShare = async (): Promise<boolean> => {
        const media = this.mediaSession
        if (!media) return false;
        let videoTrack: MediaStreamTrack | undefined;
        try {
            videoTrack = await this.deps.getScreenTrack();
            if (this.mediaSession !== media) {
                videoTrack.stop();
                return false;
            }

            await this.mediaSession.produceScreen(videoTrack);

            videoTrack.onended = () => { this.stopScreenShare(); };
            return true;
        } catch (error) {
            videoTrack?.stop();
            console.error(error);
            return false;
        }
    }

    stopScreenShare = () => {
        this.mediaSession?.stopScreenProducer();
    }

    resumeConsumer = (consumerId: string) => {
        this.mediaSession?.resumeConsumer(consumerId);
    }

    private resetConnection() {
        this.connectionUnsubscribes.forEach(fn => fn());
        this.mediaSession?.close();
        this.sfuClient?.close();

        this.sfuClient = undefined;
        this.mediaSession = undefined;
        this.connectionUnsubscribes = [];

        this.deps.store.resetMedia();
    }

    private teardown() {
        this.resetConnection();

        this.localAudio?.stop();
        this.callUnsubscribes.forEach(fn => fn());

        this.localAudio = undefined;
        this.channelId = undefined;


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
    startLocalAudio: async (deviceId, deps) => {
        return await LocalAudio.start(deviceId, deps);
    },
    emitGateway: (event) => {
        const socket = useSocketStore.getState().socket;

        socket?.emit(VOICE_UPDATE_EVENT, event);
    },
    getMediaSettings: () => {
        const { isMuted, isDeafened, audioInputDeviceId } = useAppSettingsStore.getState().mediaSettings;
        return { isMuted, isDeafened, audioInputDeviceId };
    },
    getUserId: () => {
        const { user } = useCurrentUserStore.getState();

        return user?.id;
    },
    onInputDeviceChange: (listener) => {
        const unsubscribe = useAppSettingsStore.subscribe((state, prev) => {
            const id = state.mediaSettings.audioInputDeviceId;

            if (id !== prev.mediaSettings.audioInputDeviceId) listener(id);
        });
        return unsubscribe;
    },
    onMicOffChange: (listener) => {
        const unsubscribe = useAppSettingsStore.subscribe((state, prev) => {
            const micOff = state.mediaSettings.isMuted || state.mediaSettings.isDeafened;
            const prevMicOff = prev.mediaSettings.isMuted || prev.mediaSettings.isDeafened;

            if (micOff !== prevMicOff) listener(micOff);
        });
        return unsubscribe;
    },
    onSetDeafened: (listener) => {
        const unsubscribe = useAppSettingsStore.subscribe((state, prev) => {
            const deafened = state.mediaSettings.isDeafened;

            if (deafened !== prev.mediaSettings.isDeafened) listener(deafened);
        });
        return unsubscribe;
    },
    getScreenTrack: async () => {
        const stream = await navigator.mediaDevices.getDisplayMedia({
            video: {
                frameRate: 30,
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            },
            audio: true
        });
        return stream.getVideoTracks()[0];
    },
    random: () => Math.random(),
    sleep: async (ms: number) => {
        return await new Promise(resolve => setTimeout(resolve, ms));
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
        setVoice: (status, channelId) => {
            const { setVoiceStatus } = useMediasoupStore.getState();
            setVoiceStatus(status, channelId);
        },
        resetMedia: () => {
            const { resetMedia } = useMediasoupStore.getState();
            resetMedia();
        },
        setActiveSpeaker: (userId, speaking) => {
            const { updateActiveSpeakers } = useMediasoupStore.getState();
            updateActiveSpeakers(userId, speaking);
        }
    }
})