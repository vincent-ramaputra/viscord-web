import { useVoiceEvents } from "@/app/(auth)/hooks/socket-events";
import { useAppSettingsStore } from "@/app/stores/app-settings-store";
import { usePlaySound } from "@/app/stores/audio-store";
import { useCurrentUserStore } from "@/app/stores/current-user-store";
import { useMediasoupStore } from "@/app/stores/mediasoup-store";
import { useSocketStore } from "@/app/stores/socket-store";
import { useGetChannelVoiceStates, useVoiceStateStore } from "@/app/stores/voice-state-store";
import { CONNECT_TRANSPORT, CREATE_CONSUMER, CREATE_PRODUCER, CREATE_RTC_ANSWER, CREATE_RTC_OFFER, CREATE_SEND_TRANSPORT, CREATE_RECV_TRANSPORT, VOICE_UPDATE_EVENT, RESUME_CONSUMER, JOIN_ROOM, CREATE_TRANSPORT, GET_PRODUCERS, PRODUCER_JOINED, ACTIVE_SPEAKER_STATE, PAUSE_PRODUCER, RESUME_PRODUCER, PAUSE_CONSUMER, CLOSE_PRODUCER, CLOSE_CONSUMER } from "@/constants/events";
import { useSocket } from "@/contexts/socket.context";
import { VoiceEventType } from "@/enums/voice-event-type";
import { ActiveSpeakerStateDTO } from "@/interfaces/dto/active-speaker-state.dto";
import { ConsumerCreatedDTO } from "@/interfaces/dto/consumer-created.dto";
import { CreateConsumerDTO } from "@/interfaces/dto/create-consumer.dto";
import { CreateProducerDTO } from "@/interfaces/dto/create-producer.dto";
import { ProducerCreatedDTO } from "@/interfaces/dto/producer-created.dto";
import { VoiceEventDTO } from "@/interfaces/dto/voice-event.dto";
import { VoiceState } from "@/interfaces/voice-state";
import { SfuClient } from "@/lib/voice/sfu-client";
import { createVoiceTicket } from "@/services/channels/channels.service";
import { Device } from "mediasoup-client";
import { ConsumerOptions, RtpCapabilities, Transport } from "mediasoup-client/types";
import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

// reads the store directly so transport callbacks don't see a stale render's settings
function isMicOffNow() {
    const { isMuted, isDeafened } = useAppSettingsStore.getState().mediaSettings;
    return isMuted || isDeafened;
}

export function PeerConnectionManager() {
    const { socket } = useSocket();
    const audioRef = useRef<HTMLAudioElement>(null);
    const { mediaSettings } = useAppSettingsStore();
    const isMicOff = mediaSettings.isMuted || mediaSettings.isDeafened;
    const { sfuClient, updateActiveSpeakers, setSfuClient, setDevice, setSendTransport, setRecvTransport, setReady, cleanup } = useMediasoupStore()
    const { user } = useCurrentUserStore();
    useEffect(() => {
        if (audioRef.current) audioRef.current.volume = mediaSettings.outputVolume / 100;
    }, [mediaSettings.outputVolume])

    useEffect(() => {
        let producer = Array.from(useMediasoupStore.getState().producers.values()).find(p => p.kind === 'audio');
        if (!producer) return;

        navigator.mediaDevices.getUserMedia({
            audio: { deviceId: { exact: mediaSettings.audioInputDeviceId } }
        }).then(stream => {
            const newAudioTrack = stream.getAudioTracks()[0];
            producer.track?.stop();
            producer.replaceTrack({ track: newAudioTrack });
        });
    }, [mediaSettings.audioInputDeviceId]);

    useEffect(() => {
        const { sfuClient: peerSocket, producers, channelId } = useMediasoupStore.getState();
        for (const producer of Array.from(producers.values())) {
            if (producer.kind == 'audio') {
                if (isMicOff) {
                    producer.pause();
                    peerSocket?.send(PAUSE_PRODUCER, { producerId: producer.id });
                }
                else {
                    producer.resume();
                    peerSocket?.send(RESUME_PRODUCER, { producerId: producer.id });
                }
            }
        }

        if (isMicOff) {
            if (user) updateActiveSpeakers(user.id, false);
            peerSocket?.send(ACTIVE_SPEAKER_STATE, { speaking: false } as ActiveSpeakerStateDTO)
            socket?.emit(VOICE_UPDATE_EVENT, {
                channelId, type: VoiceEventType.STATE_UPDATE, data: {
                    isMuted: true
                } as VoiceState
            } as VoiceEventDTO);
        }
        else {
            socket?.emit(VOICE_UPDATE_EVENT, {
                channelId, type: VoiceEventType.STATE_UPDATE, data: {
                    isMuted: false
                } as VoiceState
            } as VoiceEventDTO);

        }

    }, [isMicOff]);

    useEffect(() => {
        const { sfuClient: peerSocket, consumers, channelId } = useMediasoupStore.getState();
        for (const consumer of Array.from(consumers.values())) {
            if (consumer.kind == 'audio') {
                if (mediaSettings.isDeafened) {
                    consumer.pause();
                }
                else {
                    consumer.resume();
                }
            }
        }

        if (mediaSettings.isDeafened) {
            if (user) updateActiveSpeakers(user.id, false);
            peerSocket?.send(ACTIVE_SPEAKER_STATE, { speaking: false } as ActiveSpeakerStateDTO)
            peerSocket?.send(PAUSE_CONSUMER);
            socket?.emit(VOICE_UPDATE_EVENT, {
                channelId, type: VoiceEventType.STATE_UPDATE, data: {
                    isDeafened: true
                } as VoiceState
            } as VoiceEventDTO);
        }
        else {
            peerSocket?.send(RESUME_CONSUMER);
            socket?.emit(VOICE_UPDATE_EVENT, {
                channelId, type: VoiceEventType.STATE_UPDATE, data: {
                    isDeafened: false
                } as VoiceState
            } as VoiceEventDTO);
        }
    }, [mediaSettings.isDeafened])


    async function startVAD() {
        const { user } = useCurrentUserStore.getState();
        const { mediaSettings } = useAppSettingsStore.getState();
        const { sfuClient: socket } = useMediasoupStore.getState();
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: { deviceId: { ideal: mediaSettings.audioInputDeviceId } }
        })
        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);

        const dataArray = new Float32Array(analyser.fftSize);

        let speaking = false;
        let lastSpokeTime = 0;
        const SPEAK_THRESHOLD = 0.01;
        const STOP_DELAY = 300;

        function checkVolume() {
            const { isMuted, isDeafened } = useAppSettingsStore.getState().mediaSettings;
            if (isMuted || isDeafened) {
                requestAnimationFrame(checkVolume);
                return;
            }
            analyser.getFloatTimeDomainData(dataArray);

            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i] * dataArray[i];
            }
            const rms = Math.sqrt(sum / dataArray.length);

            const now = Date.now();
            if (rms > SPEAK_THRESHOLD) {
                lastSpokeTime = now;
                if (!speaking) {
                    speaking = true;

                    // if (silenceTimer) clearTimeout(silenceTimer);
                    // silenceTimer = setTimeout(() => {
                    //     console.log('speaking timed out')
                    //     updateActiveSpeakers(user.id, false);
                    //     socket?.emit(ACTIVE_SPEAKER_STATE, {
                    //         speaking: false,
                    //     } as ActiveSpeakerState);
                    // }, 3000);

                    updateActiveSpeakers(user!.id, true);
                    socket?.send(ACTIVE_SPEAKER_STATE, { speaking: true } as ActiveSpeakerStateDTO);
                }
            } else {
                if (speaking && now - lastSpokeTime > STOP_DELAY) {
                    speaking = false;
                    updateActiveSpeakers(user!.id, false);
                    socket?.send(ACTIVE_SPEAKER_STATE, { speaking: false } as ActiveSpeakerStateDTO);
                }
            }

            requestAnimationFrame(checkVolume);
        }

        requestAnimationFrame(checkVolume);
    }



    const setupJoinCall = async (channelId: string) => {
        if (sfuClient) return;

        const ticketResponse = await createVoiceTicket(channelId);
        if (!ticketResponse.success || !ticketResponse.data) return;

        const sfu = new SfuClient(ticketResponse.data.sfuUrl, ticketResponse.data.ticket);
        setSfuClient(sfu);

        try {
            await sfu.connect();

            const { rtpCapabilities } = await sfu.request(JOIN_ROOM);
            startVAD();

            const device = new Device();
            await device.load({ routerRtpCapabilities: rtpCapabilities });
            setDevice(device, channelId);

            const [sendParams, recvParams] = await Promise.all([
                sfu.request(CREATE_TRANSPORT),
                sfu.request(CREATE_TRANSPORT)
            ]);

            const recvTransport = device.createRecvTransport(recvParams);
            const sendTransport = device.createSendTransport(sendParams);

            setSendTransport(sendTransport);
            setRecvTransport(recvTransport);

            await Promise.all([
                setupSendTransport(channelId, sendTransport, sfu),
                setupRecvTransport(recvTransport, sfu)
            ]);
        } catch (error) {
            console.error('Failed connecting to SFU Server', error);
            await cleanup();
        }
    }


    const handleVoiceStateUpdate = async (event: VoiceEventDTO) => {
        const voiceStates = useGetChannelVoiceStates(event.channelId);
        const user = useCurrentUserStore.getState().user;
        const { channelId: currentChannelId } = useMediasoupStore.getState();

        if (event.type == VoiceEventType.VOICE_LEAVE) {
            if (event.userId === user?.id && event.channelId === currentChannelId) {
                closeClient();
            }
            usePlaySound('voice-leave');
        }
        else if (event.type === VoiceEventType.VOICE_JOIN) {
            if (event.userId === user?.id) {
                if (currentChannelId && currentChannelId != event.channelId) {
                    const socket = useSocketStore.getState().socket;
                    socket?.emit(VOICE_UPDATE_EVENT, {
                        channelId: currentChannelId,
                        type: VoiceEventType.VOICE_LEAVE
                    } as VoiceEventDTO)
                    await closeClient();
                }
                setupJoinCall(event.channelId);
            }

            if (event.userId === user?.id || event.channelId === voiceStates.find(vs => vs.userId === user?.id)?.channelId) {
                usePlaySound('voice-join');
            }
        }
    }

    const setupSendTransport = async (channelId: string, sendTransport: Transport, sfuClient: SfuClient) => {
        sendTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
            try {
                const success = await sfuClient.request(CONNECT_TRANSPORT, {
                    dtlsParameters,
                    transportId: sendTransport.id
                });

                callback();
            } catch (error) {
                console.error('Failed creating send transport', error);
                errback(error instanceof Error ? error : new Error(String(error)));
            }
        });

        sendTransport.on('produce', async ({ kind, rtpParameters, appData }, callback, errback) => {
            try {
                const producer = await sfuClient.request(CREATE_PRODUCER, {
                    kind,
                    rtpParameters,
                    appData,
                    channelId: channelId,
                    paused: kind === 'audio' && isMicOffNow(),
                    transportId: sendTransport.id
                });

                callback(producer);
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

        const { addProducer } = useMediasoupStore.getState();
        try {
            const inputId = useAppSettingsStore.getState().mediaSettings.audioInputDeviceId;
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    deviceId: inputId ? { exact: inputId } : undefined,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            const [track] = stream.getAudioTracks();
            if (!track) {
                throw new Error('No audio track found in stream');
            }
            const producer = await sendTransport.produce({ track: track });

            addProducer(producer.id, producer);
        }
        catch (error) {
            console.error('Error creating producer:', error);
        }

    }

    const setupRecvTransport = async (recvTransport: Transport, sfuClient: SfuClient) => {
        recvTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
            try {
                await sfuClient.request(CONNECT_TRANSPORT, {
                    transportId: recvTransport.id,
                    dtlsParameters
                });

                callback();
            } catch (error) {
                console.log('Failed connecting recv transport', error)
                errback(error instanceof Error ? error : new Error(String(error)));
            }
        });

        const { producers } = await sfuClient.request(GET_PRODUCERS);
        for (const producer of producers) {
            createConsumer({ producerId: producer.producerId, userId: producer.userId });
        }
    }


    const createConsumer = async (producerDTO: ProducerCreatedDTO) => {
        const { sfuClient: sfuClient, device, recvTransport, addConsumer } = useMediasoupStore.getState();
        const user = useCurrentUserStore.getState().user;
        if (!device || !recvTransport || !sfuClient) return;
        if (producerDTO.userId === user?.id) return;

        try {
            const payload = await sfuClient.request(CREATE_CONSUMER, {
                transportId: recvTransport.id,
                producerId: producerDTO.producerId,
                rtpCapabilities: device.rtpCapabilities
            } as CreateConsumerDTO);

            const consumer = await recvTransport.consume({
                producerId: payload.producerId,
                id: payload.id,
                kind: payload.kind,
                rtpParameters: payload.rtpParameters,
                appData: payload.appData
            });
            // if (audioRef.current) {
            //     const stream = new MediaStream([consumer.track]);
            //     audioRef.current.srcObject = stream;
            //     audioRef.current.autoplay = true;
            //     audioRef.current.muted = false;

            // } else {
            // console.log('b', consumer.kind)
            //     console.error('Audio element not found');
            // }
            if (consumer.appData?.mediaTag !== 'screen') {
                sfuClient.send(RESUME_CONSUMER);
                consumer.resume();
            }


            addConsumer(consumer.id, consumer);

        } catch (error) {
            console.error('Error creating consumer:', error);
        }
    }

    const closeClient = async () => {
        const { cleanup } = useMediasoupStore.getState();

        await cleanup();
    }

    const handleCloseProducer = ({ producerId }: { producerId: string }) => {
        const { consumers, removeConsumer, sfuClient } = useMediasoupStore.getState();
        const consumer = Array.from(consumers.values()).find(c => c.producerId === producerId);
        if (!consumer || !sfuClient) return;
        removeConsumer(consumer.id);
        sfuClient.send(CLOSE_CONSUMER, { consumerId: consumer.id });
    }


    const handleBeforeUnload = useCallback(() => {
        const socket = useSocketStore.getState().socket;
        const { channelId } = useMediasoupStore.getState();
        socket?.emit(VOICE_UPDATE_EVENT, { channelId, type: VoiceEventType.VOICE_LEAVE });

        closeClient();
    }, [socket]);

    const onActiveSpeaker = (payload: ActiveSpeakerStateDTO) => {
        updateActiveSpeakers(payload.userId, payload.speaking);
    }

    useEffect(() => {
        if (!socket) return;
        socket.on(VOICE_UPDATE_EVENT, handleVoiceStateUpdate);
        setReady(true);
        console.log('peer socket is ready');
        return () => {
            socket?.removeListener(VOICE_UPDATE_EVENT, handleVoiceStateUpdate);
        }
    }, [socket]);

    useEffect(() => {
        if (!sfuClient) return;
        const unsubscribeCallbacks = [
            sfuClient.on(PRODUCER_JOINED, createConsumer),
            sfuClient.on(ACTIVE_SPEAKER_STATE, onActiveSpeaker),
            sfuClient.on(CLOSE_PRODUCER, handleCloseProducer)
        ];

        return () => {
            unsubscribeCallbacks.forEach(callback => callback());
        }
    }, [sfuClient])



    useEffect(() => {
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);

    return (
        <>
            {Array.from(useMediasoupStore.getState().consumers.values()).map((consumer) => (
                consumer.kind === "audio" ? (
                    <audio
                        key={consumer.id}
                        ref={(el) => {
                            if (el && consumer.track) {
                                const stream = new MediaStream([consumer.track]);
                                el.srcObject = stream;
                            }
                        }}
                        autoPlay
                        playsInline
                    />
                ) : null
            ))}
        </>
    );
}