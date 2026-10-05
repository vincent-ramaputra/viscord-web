import { CLOSE_CONSUMER, CLOSE_PRODUCER, CONNECT_TRANSPORT, CREATE_CONSUMER, CREATE_PRODUCER, CREATE_TRANSPORT, GET_PRODUCERS, JOIN_ROOM, PAUSE_CONSUMER, PAUSE_PRODUCER, PRODUCER_JOINED, RESUME_CONSUMER, RESUME_PRODUCER } from "@/constants/events";
import { SfuClient } from "./sfu-client";
import { Device } from "mediasoup-client";
import { Consumer, Producer, Transport } from "mediasoup-client/types";
import { ProducerCreatedDTO } from "@/interfaces/dto/producer-created.dto";

export interface MediaSessionEvents {
    onConsumerAdded(consumer: Consumer): void;
    onConsumerRemoved(consumerId: string): void;
    onProducerAdded(producer: Producer): void;
    onProducerRemoved(producerId: string): void;
}

export class MediaSession {
    private readonly sfuClient: SfuClient;
    private readonly userId: string;
    private readonly channelId: string;

    private device?: Device;
    private recvTransport?: Transport;
    private sendTransport?: Transport;
    private consumedProducerIds: Set<string> = new Set();
    private producers: Map<string, Producer> = new Map();
    private consumers: Map<string, Consumer> = new Map();
    private audioConsumerPaused: boolean;
    private audioProducerPaused: boolean;

    private events: MediaSessionEvents;
    private unsubscribes: Array<() => void> = [];

    private closed: boolean = false;

    private constructor(sfuClient: SfuClient, userId: string, channelId: string, events: MediaSessionEvents, audioConsumerPaused: boolean, audioProducerPaused: boolean) {
        this.sfuClient = sfuClient;
        this.userId = userId;
        this.channelId = channelId;
        this.events = events;
        this.audioConsumerPaused = audioConsumerPaused;
        this.audioProducerPaused = audioProducerPaused;
    }

    static async start(sfuClient: SfuClient, { userId, channelId, audioConsumerPaused, audioProducerPaused}: { userId: string, channelId: string, audioConsumerPaused: boolean, audioProducerPaused: boolean}, events: MediaSessionEvents) {
        const session = new MediaSession(sfuClient, userId, channelId, events, audioConsumerPaused, audioProducerPaused);
        try {
            const { rtpCapabilities } = await sfuClient.request(JOIN_ROOM, {isMuted: audioProducerPaused, isDeafened: audioConsumerPaused});
            if (session.closed) throw new Error("Session closed");

            const device = new Device();
            await device.load({ routerRtpCapabilities: rtpCapabilities });
            if (session.closed) throw new Error("Session closed");
            session.device = device;

            const [sendParams, recvParams] = await Promise.all([
                sfuClient.request(CREATE_TRANSPORT),
                sfuClient.request(CREATE_TRANSPORT)
            ]);

            if (session.closed) throw new Error("Session closed");

            const recvTransport = device.createRecvTransport(recvParams);
            const sendTransport = device.createSendTransport(sendParams);

            session.sendTransport = sendTransport;
            session.recvTransport = recvTransport;

            session.unsubscribes.push(
                sfuClient.on(CLOSE_PRODUCER, (dto) => session.removeConsumerForProducer(dto.producerId)),
                sfuClient.on(PRODUCER_JOINED, (dto) => session.createConsumer(dto))
            );

            await Promise.all([
                session.setupSendTransport(),
                session.setupRecvTransport()
            ]);
            if (session.closed) throw new Error("Session closed");

            return session;
        } catch (error) {
            session.close();
            throw error;
        }
    }

    private async setupSendTransport() {
        this.sendTransport?.on('connect', async ({ dtlsParameters }, callback, errback) => {
            try {
                await this.sfuClient.request(CONNECT_TRANSPORT, {
                    dtlsParameters,
                    transportId: this.sendTransport!.id
                });

                callback();
            } catch (error) {
                console.error('Failed creating send transport', error);
                errback(error instanceof Error ? error : new Error(String(error)));
            }
        });

        this.sendTransport?.on('produce', async ({ kind, rtpParameters, appData }, callback, errback) => {
            try {
                const response = await this.sfuClient.request(CREATE_PRODUCER, {
                    kind,
                    rtpParameters,
                    appData,
                    channelId: this.channelId,
                    // this handler runs for every producer; only the mic follows the mute state
                    paused: appData?.mediaTag === 'mic' && this.audioProducerPaused,
                    transportId: this.sendTransport!.id
                });

                callback(response);
            } catch (error) {
                console.error('Failed creating audio producer', error);
                if (error instanceof Error) {
                    errback(error);
                }
                else {
                    errback(new Error());
                }
            }
        });

    }

    private async setupRecvTransport() {
        this.recvTransport?.on('connect', async ({ dtlsParameters }, callback, errback) => {
            try {
                await this.sfuClient.request(CONNECT_TRANSPORT, {
                    transportId: this.recvTransport!.id,
                    dtlsParameters
                });

                callback();
            } catch (error) {
                console.log('Failed connecting recv transport', error)
                errback(error instanceof Error ? error : new Error(String(error)));
            }
        });

        const { producers } = await this.sfuClient.request(GET_PRODUCERS);
        if (this.closed) return;

        for (const producer of producers) {
            this.createConsumer({ producerId: producer.producerId, userId: producer.userId });
        }
    }

    private async createConsumer(producerDTO: ProducerCreatedDTO) {
        if (this.closed) return;
        if (producerDTO.userId === this.userId || this.consumedProducerIds.has(producerDTO.producerId)) return;

        this.consumedProducerIds.add(producerDTO.producerId);

        try {
            if (!this.device) throw new Error(`device is ${typeof this.device}`);
            if (!this.recvTransport) throw new Error(`recvTransport is ${typeof this.recvTransport}`);

            const payload = await this.sfuClient.request(CREATE_CONSUMER, {
                transportId: this.recvTransport.id,
                producerId: producerDTO.producerId,
                rtpCapabilities: this.device.rtpCapabilities
            });
            if (this.closed) return;

            const consumer = await this.recvTransport.consume({
                producerId: payload.producerId,
                id: payload.id,
                kind: payload.kind,
                rtpParameters: payload.rtpParameters,
                appData: payload.appData
            });
            if (this.closed) return;

            this.consumers.set(consumer.id, consumer);

            // new consumers start unpaused on both sides, so a deafened client has to pause
            // new audio itself (on the SFU too, so it stops forwarding audio we'd discard)
            if (consumer.kind === 'audio' && this.audioConsumerPaused) {
                this.pauseConsumer(consumer.id);
            }

            this.events.onConsumerAdded(consumer);
        } catch (error) {
            console.error('Error creating consumer:', error);
            this.consumedProducerIds.delete(producerDTO.producerId);
        }
    }

    private removeConsumerForProducer(producerId: string) {
        const consumer = Array.from(this.consumers.values()).find(c => c.producerId === producerId);
        if (!consumer) return;

        this.consumers.delete(consumer.id);

        this.sfuClient.send(CLOSE_CONSUMER, { consumerId: consumer.id });
        consumer.close();

        this.consumedProducerIds.delete(producerId);
        this.events.onConsumerRemoved(consumer.id);
    }

    async produceMic(track: MediaStreamTrack) {
        if (!this.sendTransport) throw new Error(`sendTransport is ${typeof this.sendTransport}`)

        // zeroRtpOnPause: send no RTP at all while muted instead of silent packets
        const producer = await this.sendTransport.produce({ track, stopTracks: false, zeroRtpOnPause: true, appData: { mediaTag: 'mic'} });
        if (this.closed) throw new Error("Session closed");

        this.producers.set(producer.id, producer);
        this.events.onProducerAdded(producer);
        if (this.audioProducerPaused) producer.pause();
    }

    async produceScreen(track: MediaStreamTrack) {
        if (!this.sendTransport) throw new Error(`sendTransport is ${typeof this.sendTransport}`)

        const producer = await this.sendTransport.produce({ track, appData: { mediaTag: 'screen' } });
        if (this.closed) throw new Error("Session closed");

        this.producers.set(producer.id, producer);
        this.events.onProducerAdded(producer);
    }

    stopScreenProducer() {
        const screenProducer = Array.from(this.producers.values()).find(p => p.appData?.mediaTag === 'screen');
        if (!screenProducer) return;

        this.closeProducer(screenProducer.id);
    }

    closeProducer(producerId: string) {
        const producer = this.producers.get(producerId);
        if (!producer) return;

        this.sfuClient.send(CLOSE_PRODUCER, { producerId: producer.id });
        producer.close();

        this.producers.delete(producer.id);
        this.events.onProducerRemoved(producer.id);
    }

    setMicPaused(paused: boolean) {
        this.audioProducerPaused = paused;
        const producer = Array.from(this.producers.values()).find(p => p.appData?.mediaTag === 'mic');
        if (!producer) return;

        if (paused) {
            this.pauseProducer(producer.id);
        }
        else {
            this.resumeProducer(producer.id);
        }
    }

    setAudioConsumerPaused(paused: boolean) {
        this.audioConsumerPaused = paused;
        for (const consumer of Array.from(this.consumers.values())) {
            if (consumer.kind == 'audio') {
                if (paused) {
                    this.pauseConsumer(consumer.id);
                }
                else {
                    this.resumeConsumer(consumer.id);
                }
            }
        }
    }


    async replaceMicTrack(track: MediaStreamTrack) {
        const producer = Array.from(this.producers.values()).find(p => p.appData?.mediaTag === 'mic');
        if (!producer) throw new Error('Mic producer not found');

        await producer.replaceTrack({ track });
    }

    private pauseProducer(producerId: string) {
        const producer = this.producers.get(producerId);
        if (!producer) return;

        this.sfuClient.send(PAUSE_PRODUCER, { producerId });
        producer.pause();
    }

    private resumeProducer(producerId: string) {
        const producer = this.producers.get(producerId);
        if (!producer) return;

        this.sfuClient.send(RESUME_PRODUCER, { producerId });
        producer.resume();
    }

    resumeConsumer(consumerId: string) {
        const consumer = this.consumers.get(consumerId);
        if (!consumer) return;

        this.sfuClient.send(RESUME_CONSUMER, { consumerId });
        consumer.resume();
    }

    private pauseConsumer(consumerId: string) {
        const consumer = this.consumers.get(consumerId);
        if (!consumer) return;

        this.sfuClient.send(PAUSE_CONSUMER, { consumerId });
        consumer.pause();
    }

    close() {
        if (this.closed) return;
        this.closed = true;

        this.producers.forEach((p) => p.close());
        this.consumers.forEach((c) => c.close());
        this.sendTransport?.close();
        this.recvTransport?.close();
        this.unsubscribes.forEach(fn => fn());
    }

}