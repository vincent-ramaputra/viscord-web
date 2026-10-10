import { MediaKind, RtpParameters } from "mediasoup-client/types";

export interface CreateProducerDTO {
    transportId: string;
    channelId: string;
    kind: MediaKind;
    rtpParameters: RtpParameters;
    paused: boolean;
    appData: { mediaTag: 'mic' | 'screen' };
}