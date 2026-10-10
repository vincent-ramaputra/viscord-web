import { RtpParameters } from "mediasoup-client/types";

export interface ConsumerCreatedDTO {
    id: string;
    producerId: string;
    userId: string;
    kind: 'audio' | 'video';
    rtpParameters: RtpParameters;
    appData: { mediaTag: 'mic' | 'screen' };
}