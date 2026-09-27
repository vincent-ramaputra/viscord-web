import { useAppSettingsStore } from "@/app/stores/app-settings-store";
import { usePlaySound } from "@/app/stores/audio-store";
import { useCurrentUserStore } from "@/app/stores/current-user-store";
import { useMediasoupStore } from "@/app/stores/mediasoup-store";
import { VOICE_UPDATE_EVENT } from "@/constants/events";
import { useSocket } from "@/contexts/socket.context";
import { VoiceEventType } from "@/enums/voice-event-type";
import { VoiceEventDTO } from "@/interfaces/dto/voice-event.dto";
import { voiceSession } from "@/lib/voice/voice-session";
import {useEffect, useRef } from "react";


export function PeerConnectionManager() {
    const { socket } = useSocket();
    const audioRef = useRef<HTMLAudioElement>(null);
    const mediaSettings = useAppSettingsStore(s => s.mediaSettings);
    const { setReady } = useMediasoupStore()
    useEffect(() => {
        if (audioRef.current) audioRef.current.volume = mediaSettings.outputVolume / 100;
    }, [mediaSettings.outputVolume])


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