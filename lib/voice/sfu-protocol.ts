import {
    ACTIVE_SPEAKER_STATE,
    CLOSE_CONSUMER,
    CLOSE_PRODUCER,
    CLOSE_SFU_CLIENT,
    CONNECT_TRANSPORT,
    CREATE_CONSUMER,
    CREATE_PRODUCER,
    CREATE_TRANSPORT,
    GET_PRODUCERS,
    JOIN_ROOM,
    PAUSE_CONSUMER,
    PAUSE_PRODUCER,
    PRODUCER_JOINED,
    RESUME_CONSUMER,
    RESUME_PRODUCER,
    SESSION_REPLACED
} from "@/constants/events";
import { ActiveSpeakerStateDTO } from "@/interfaces/dto/active-speaker-state.dto";
import { ConnectTransportDTO } from "@/interfaces/dto/connect-transport.dto";
import { ConsumerCreatedDTO } from "@/interfaces/dto/consumer-created.dto";
import { CreateConsumerDTO } from "@/interfaces/dto/create-consumer.dto";
import { CreateProducerDTO } from "@/interfaces/dto/create-producer.dto";
import { JoinRoomDTO } from "@/interfaces/dto/join-room.dto";
import { ProducerCreatedDTO } from "@/interfaces/dto/producer-created.dto";
import { RtpCapabilities, TransportOptions } from "mediasoup-client/types";


export interface ClientToServerEvents {
    [JOIN_ROOM]: (dto: JoinRoomDTO, ack: (res: { rtpCapabilities: RtpCapabilities } | null) => void) => void;
    [CREATE_TRANSPORT]: (ack: (res: Pick<TransportOptions, 'id' | 'iceParameters' | 'iceCandidates' | 'dtlsParameters'> | null) => void) => void;
    [CONNECT_TRANSPORT]: (dto: ConnectTransportDTO, ack: (res: true | null) => void) => void;
    [CREATE_PRODUCER]: (dto: CreateProducerDTO, ack: (res: { id: string } | null) => void) => void;
    [CREATE_CONSUMER]: (
        dto: Pick<CreateConsumerDTO, 'transportId' | 'producerId' | 'rtpCapabilities'>,
        ack: (res: Omit<ConsumerCreatedDTO, 'userId'> | null) => void
    ) => void;
    [GET_PRODUCERS]: (ack: (res: { producers: ProducerCreatedDTO[] } | null) => void) => void;

    [PAUSE_PRODUCER]: (dto: { producerId: string }) => void;
    [RESUME_PRODUCER]: (dto: { producerId: string }) => void;
    [PAUSE_CONSUMER]: (dto: { consumerId: string }) => void;
    [RESUME_CONSUMER]: (dto: { consumerId: string }) => void;
    [ACTIVE_SPEAKER_STATE]: (dto: Omit<ActiveSpeakerStateDTO, 'userId'>) => void;
    [CLOSE_PRODUCER]: (dto: { producerId: string }) => void;
    [CLOSE_CONSUMER]: (dto: { consumerId: string }) => void;
    [CLOSE_SFU_CLIENT]: () => void;
}

export interface ServerToClientEvents {
    [PRODUCER_JOINED]: (dto: ProducerCreatedDTO) => void;
    [ACTIVE_SPEAKER_STATE]: (dto: ActiveSpeakerStateDTO) => void;
    [CLOSE_PRODUCER]: (dto: { producerId: string }) => void;
    [SESSION_REPLACED]: () => void;
}
