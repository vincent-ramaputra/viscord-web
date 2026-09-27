import { useAppSettingsStore } from "@/app/stores/app-settings-store";
import { usePlaySound } from "@/app/stores/audio-store";
import { useCurrentUserStore } from "@/app/stores/current-user-store";
import { useMediasoupStore } from "@/app/stores/mediasoup-store";
import { VOICE_UPDATE_EVENT, RESUME_CONSUMER, ACTIVE_SPEAKER_STATE, PAUSE_PRODUCER, RESUME_PRODUCER, PAUSE_CONSUMER } from "@/constants/events";
import { useSocket } from "@/contexts/socket.context";
import { VoiceEventType } from "@/enums/voice-event-type";
import { ActiveSpeakerStateDTO } from "@/interfaces/dto/active-speaker-state.dto";
import { VoiceEventDTO } from "@/interfaces/dto/voice-event.dto";
import { VoiceState } from "@/interfaces/voice-state";
import { voiceSession } from "@/lib/voice/voice-session";
import {useEffect, useRef } from "react";

// reads the store directly so transport callbacks don't see a stale render's settings
function isMicOffNow() {
    const { isMuted, isDeafened } = useAppSettingsStore.getState().mediaSettings;
    return isMuted || isDeafened;
}

export function PeerConnectionManager() {
    const { socket } = useSocket();
    const audioRef = useRef<HTMLAudioElement>(null);
    const mediaSettings = useAppSettingsStore(s => s.mediaSettings);
    const { sfuClient, updateActiveSpeakers, setReady, voiceStatus } = useMediasoupStore()
    const isMicOff = mediaSettings.isMuted || mediaSettings.isDeafened;
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
    }, [mediaSettings.isDeafened]);

    useEffect(() => {
        if (voiceStatus === 'connected') startVAD();

    }, [voiceStatus])


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


    const handleVoiceStateUpdate = async (event: VoiceEventDTO) => {
        const user = useCurrentUserStore.getState().user;
        const { channelId } = useMediasoupStore.getState();

        if (event.type == VoiceEventType.VOICE_LEAVE) {
            usePlaySound('voice-leave');
        }
        else if (event.type === VoiceEventType.VOICE_JOIN) {
            if (event.userId === user?.id || event.channelId === channelId) {
                usePlaySound('voice-join');
            }
        }
    }




    const handleBeforeUnload = () => { voiceSession.leave() };
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
            sfuClient.on(ACTIVE_SPEAKER_STATE, onActiveSpeaker),
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