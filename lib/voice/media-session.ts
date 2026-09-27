import { CLOSE_CONSUMER, CLOSE_PRODUCER, CONNECT_TRANSPORT, CREATE_CONSUMER, CREATE_PRODUCER, CREATE_TRANSPORT, GET_PRODUCERS, JOIN_ROOM, PRODUCER_JOINED, RESUME_CONSUMER } from "@/constants/events";
import { SfuClient } from "./sfu-client";
import { Device } from "mediasoup-client";
import { Consumer, Producer, Transport } from "mediasoup-client/types";
import { ProducerCreatedDTO } from "@/interfaces/dto/producer-created.dto";
import { CreateConsumerDTO } from "@/interfaces/dto/create-consumer.dto";

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

    private events: MediaSessionEvents;
    private unsubscribes: Array<() => void> = [];

    private closed: boolean = false;

    private constructor(sfuClient: SfuClient, userId: string, channelId: string, events: MediaSessionEvents) {
        this.sfuClient = sfuClient;
        this.userId = userId;
        this.channelId = channelId;
        this.events = events;
    }

    static async start(sfuClient: SfuClient, { userId, channelId }: { userId: string, channelId: string }, events: MediaSessionEvents) {
        const session = new MediaSession(sfuClient, userId, channelId, events);
        try {
            const { rtpCapabilities } = await sfuClient.request(JOIN_ROOM);
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
                    paused: appData.paused === true,
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

            if (consumer.appData?.mediaTag !== 'screen') {
                this.sfuClient.send(RESUME_CONSUMER);
                consumer.resume();
            }

            this.consumers.set(consumer.id, consumer);
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

    async produceMic(track: MediaStreamTrack, { paused }: { paused: boolean }) {
        if (!this.sendTransport) throw new Error(`sendTransport is ${typeof this.sendTransport}`)

        const producer = await this.sendTransport.produce({ track, appData: { mediaTag: 'mic', paused } });
        if (this.closed) throw new Error("Session closed");
        
        this.producers.set(producer.id, producer);
        this.events.onProducerAdded(producer);
    }

    async produceScreen(track: MediaStreamTrack) {
        if (!this.sendTransport) throw new Error(`sendTransport is ${typeof this.sendTransport}`)

        const producer = await this.sendTransport.produce({ track, appData: { mediaTag: 'screen' } });
        if (this.closed) throw new Error("Session closed");

        this.producers.set(producer.id, producer);
        this.events.onProducerAdded(producer);
    }

    closeProducer(producerId: string) {
        const producer = this.producers.get(producerId);
        if (!producer) return;

        this.sfuClient.send(CLOSE_PRODUCER, { producerId: producer.id });
        producer.close();

        this.producers.delete(producer.id);
        this.events.onProducerRemoved(producer.id);
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