import { useAppSettingsStore } from "@/app/stores/app-settings-store";
import { useMediasoupStore } from "@/app/stores/mediasoup-store";
import { useEffect, useRef } from "react";


export function VoiceAudioRenderer() {
    const consumers = useMediasoupStore(s => s.consumers);
    const outputVolume = useAppSettingsStore(s => s.mediaSettings.outputVolume) / 100;
    const audioOutputDeviceId = useAppSettingsStore(s => s.mediaSettings.audioOutputDeviceId);

    return (
        <>
            {Array.from(consumers.values()).map((consumer) => (
                consumer.kind === "audio" ?
                <RemoteAudio key={consumer.id} track={consumer.track} volume={outputVolume} sinkId={audioOutputDeviceId}/> : null
            ))}
        </>
    );
}

function RemoteAudio({ track, volume, sinkId }: {track: MediaStreamTrack, volume: number, sinkId: string | undefined}) {
    const ref = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        if (ref.current) ref.current.srcObject = new MediaStream([track]);
    }, [track]);

    useEffect(() => {
        if (ref.current) ref.current.volume = volume;
    }, [volume]);

    useEffect(() => {
        const el = ref.current;
        if (!el || !sinkId || !('setSinkId' in el)) return;
        el.setSinkId(sinkId).catch(err => console.warn('Could not set output device', err));
    }, [sinkId]);

    return <audio ref={ref} autoPlay playsInline/>
}