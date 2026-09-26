import { useVoiceEvents } from "@/app/(auth)/hooks/socket-events";
import { useAppSettingsStore } from "@/app/stores/app-settings-store";
import { usePlaySound } from "@/app/stores/audio-store";
import { useCurrentUserStore } from "@/app/stores/current-user-store";
import { useMediasoupStore } from "@/app/stores/mediasoup-store";
import { useSocketStore } from "@/app/stores/socket-store";
import { useGetChannelVoiceStates, useVoiceStateStore } from "@/app/stores/voice-state-store";
import { CONNECT_TRANSPORT, CREATE_CONSUMER, CREATE_PRODUCER, CREATE_RTC_ANSWER, CREATE_RTC_OFFER, CREATE_SEND_TRANSPORT, CREATE_RECV_TRANSPORT, VOICE_UPDATE_EVENT, RESUME_CONSUMER, CLOSE_SFU_CLIENT, JOIN_ROOM, CREATE_TRANSPORT, GET_PRODUCERS, PRODUCER_JOINED, ACTIVE_SPEAKER_STATE, PAUSE_PRODUCER, RESUME_PRODUCER, PAUSE_CONSUMER, CLOSE_PRODUCER, CLOSE_CONSUMER } from "@/constants/events";
import { useSocket } from "@/contexts/socket.context";
import { VoiceEventType } from "@/enums/voice-event-type";
import { ActiveSpeakerState } from "@/interfaces/active-speaker-state";
import { ConsumerCreatedDTO } from "@/interfaces/dto/consumer-created.dto";
import { CreateConsumerDTO } from "@/interfaces/dto/create-consumer.dto";
import { CreateProducerDTO } from "@/interfaces/dto/create-producer.dto";
import { ProducerCreatedDTO } from "@/interfaces/dto/producer-created.dto";
import { VoiceEventDTO } from "@/interfaces/dto/voice-event.dto";
import { VoiceState } from "@/interfaces/voice-state";
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
    const { socket: peerSocket, updateActiveSpeakers, setSocket, setDevice, setSendTransport, setRecvTransport, setReady, producers } = useMediasoupStore()
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
        const { socket: peerSocket, producers, channelId } = useMediasoupStore.getState();
        for (const producer of Array.from(producers.values())) {
            if (producer.kind == 'audio') {
                if (isMicOff) {
                    producer.pause();
                    peerSocket?.emit(PAUSE_PRODUCER, { producerId: producer.id }, () => {
                    })
                }
                else {
                    producer.resume();
                    peerSocket?.emit(RESUME_PRODUCER, { producerId: producer.id }, () => {
                    })
                }
            }
        }

        if (isMicOff) {
            if (user) updateActiveSpeakers(user.id, false);
            peerSocket?.emit(ACTIVE_SPEAKER_STATE, { speaking: false } as ActiveSpeakerState)
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
        const { socket: peerSocket, consumers, channelId } = useMediasoupStore.getState();
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
            peerSocket?.emit(ACTIVE_SPEAKER_STATE, { speaking: false } as ActiveSpeakerState)
            peerSocket?.emit(PAUSE_CONSUMER);
            socket?.emit(VOICE_UPDATE_EVENT, {
                channelId, type: VoiceEventType.STATE_UPDATE, data: {
                    isDeafened: true
                } as VoiceState
            } as VoiceEventDTO);
        }
        else {
            peerSocket?.emit(RESUME_CONSUMER);
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
        const { socket } = useMediasoupStore.getState();
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: { deviceId: { exact: mediaSettings.audioInputDeviceId } }
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
                    socket?.emit(ACTIVE_SPEAKER_STATE, { speaking: true } as ActiveSpeakerState);
                }
            } else {
                if (speaking && now - lastSpokeTime > STOP_DELAY) {
                    speaking = false;
                    updateActiveSpeakers(user!.id, false);
                    socket?.emit(ACTIVE_SPEAKER_STATE, { speaking: false } as ActiveSpeakerState);
                }
            }

            requestAnimationFrame(checkVolume);
        }

        requestAnimationFrame(checkVolume);
    }



    const setupJoinCall = async (channelId: string) => {
        if (peerSocket) return;

        const ticketResponse = await createVoiceTicket(channelId);
        if (!ticketResponse.success || !ticketResponse.data) return;

        const socket = io(ticketResponse.data.sfuUrl, {
            auth: { ticket: ticketResponse.data.ticket }
        });
        const user = useCurrentUserStore.getState().user;
        setSocket(socket);
        console.log('creating socket', socket);

        const onRoomJoined = async ({ rtpCapabilities }: { rtpCapabilities: RtpCapabilities }) => {
            console.log('setting device', channelId);
            startVAD();
            const device = new Device();
            await device.load({ routerRtpCapabilities: rtpCapabilities });
            setDevice(device, channelId);

            socket.emit(CREATE_TRANSPORT, onCreateSendTransport);
            socket.emit(CREATE_TRANSPORT, onCreateRecvTransport);
        };

        socket.on('connect_error', (e) => console.log('connect error', e));
        socket.on('connect', () => {
            console.log('peer socket connected')
            socket.emit(JOIN_ROOM, onRoomJoined);
        });
    }

    const onGetChannelProducers = ({ producers }: { producers: { userId: string, producerId: string }[] }) => {
        for (const producer of producers) {
            createConsumer({ producerId: producer.producerId, userId: producer.userId });
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

    const onCreateSendTransport = async (payload: any) => {
        const { socket, device, addProducer, channelId } = useMediasoupStore.getState();
        const { mediaSettings } = useAppSettingsStore.getState();
        if (!device) return;
        const transport = device.createSendTransport(payload);
        transport.on('connect', async ({ dtlsParameters }, callback, errback) => {
            try {
                socket?.emit(CONNECT_TRANSPORT, {
                    transportId: transport.id,
                    dtlsParameters
                }, callback);
            } catch (err) {
                console.log(err)
            }
        });
        transport.on('produce', async ({ kind, rtpParameters, appData }, callback, errback) => {
            const payload: CreateProducerDTO = {
                transportId: transport.id,
                channelId: channelId!,
                kind,
                rtpParameters,
                appData,
                paused: kind === 'audio' && isMicOffNow()
            }
            try {
                socket?.emit(CREATE_PRODUCER, payload, ({ id }: { id: string }) => {
                    callback({ id });
                });
            } catch (err) {
                console.log(err);
            }
        });
        setSendTransport(transport);

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
            const producer = await transport.produce({ track: track });

            addProducer(producer.id, producer);
        }
        catch (error) {
            console.error('Error creating producer:', error);
        }
    }

    const onCreateRecvTransport = (payload: any) => {
        const { socket, device, channelId } = useMediasoupStore.getState();
        if (!device) return;
        const transport = device.createRecvTransport(payload);
        transport.on('connect', async ({ dtlsParameters }, callback) => {
            try {
                socket?.emit(CONNECT_TRANSPORT, {
                    transportId: transport.id,
                    dtlsParameters
                }, callback);
            } catch (err) {
                console.log(err)
            }
        });
        setRecvTransport(transport);

        if (channelId) {
            socket?.emit(GET_PRODUCERS, onGetChannelProducers);
        }
    }


    const createConsumer = async (payload: ProducerCreatedDTO) => {
        const { socket, device, recvTransport } = useMediasoupStore.getState();
        const user = useCurrentUserStore.getState().user;
        if (!device || !recvTransport) return;
        if (payload.userId !== user?.id) {
            socket?.emit(CREATE_CONSUMER, {
                transportId: recvTransport.id,
                producerId: payload.producerId,
                rtpCapabilities: device.rtpCapabilities
            } as CreateConsumerDTO, onConsumerCreated);
        }
    }

    const onConsumerCreated = async (payload: ConsumerCreatedDTO) => {
        const { socket, recvTransport, addConsumer } = useMediasoupStore.getState();
        if (!recvTransport) {
            console.error('No receive transport available for consumer creation');
            return;
        }

        try {
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
                socket?.emit(RESUME_CONSUMER, { consumerId: consumer.id }, () => {
                    consumer.resume();
                });
            }


            addConsumer(consumer.id, consumer);

        } catch (error) {
            console.error('Error creating consumer:', error);
        }
    }

    const closeClient = async () => {
        const { socket, cleanup } = useMediasoupStore.getState();

        socket?.emit(CLOSE_SFU_CLIENT);
        await cleanup();
    }

    const handleCloseProducer = ({ producerId }: { producerId: string }) => {
        const { consumers, removeConsumer, socket } = useMediasoupStore.getState();
        const consumer = Array.from(consumers.values()).find(c => c.producerId === producerId);
        if (!consumer) return;
        removeConsumer(consumer.id);
        socket?.emit(CLOSE_CONSUMER, { consumerId: consumer.id });
    }


    const handleBeforeUnload = useCallback(() => {
        const socket = useSocketStore.getState().socket;
        const { socket: peerSocket, channelId } = useMediasoupStore.getState();
        socket?.emit(VOICE_UPDATE_EVENT, { channelId, type: VoiceEventType.VOICE_LEAVE });

        closeClient();
    }, [socket]);

    const onActiveSpeaker = (payload: ActiveSpeakerState) => {
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
        if (!peerSocket) return;
        peerSocket.on(PRODUCER_JOINED, createConsumer);
        peerSocket.on(ACTIVE_SPEAKER_STATE, onActiveSpeaker);
        peerSocket?.on(CLOSE_PRODUCER, handleCloseProducer);

        return () => {
            peerSocket.removeListener(CLOSE_PRODUCER, handleCloseProducer)
            peerSocket.removeListener(PRODUCER_JOINED, createConsumer);
            peerSocket.removeListener(ACTIVE_SPEAKER_STATE, onActiveSpeaker);
        }
    }, [peerSocket])



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