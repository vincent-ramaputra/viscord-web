import { DtlsParameters } from "mediasoup-client/types";

export interface ConnectTransportDTO {
    transportId: string;
    dtlsParameters: DtlsParameters;
}