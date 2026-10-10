import { useAppSettingsStore } from "@/app/stores/app-settings-store";
import { ReactNode, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { SettingsSectionHeader } from "./settings-page";
import { MAX_VOLUME, MIN_VOLUME } from "@/constants/app-config";

interface TabItem {
    id: string;
    header: string;
    content?: ReactNode;
}

const TabBar = styled.div`
    display: flex;
    gap: 16px;
    border-bottom: 1px solid var(--border-subtle);
`

const Tab = styled.span`
    color: var(--interactive-normal);
    font-weight: 600;
    padding-bottom: 16px;
    cursor: pointer;
    &.active {
        color: var(--text-brand);
        border-bottom: 1px solid var(--text-brand);
    }

    &:hover {
        color: var(--interactive-hover);
        border-bottom: 1px solid var(--text-brand);
    }
`


export function MediaSettingsSection() {
    const tabItems: TabItem[] = [
        {
            id: 'voice',
            header: 'Voice',
            content: <VoiceSettingsTab />
        },
        {
            id: 'video',
            header: 'Video',
            content: undefined
        }
    ];

    const [selectedTab] = useState<TabItem>(tabItems[0]);
    return (
        <div className="flex gap-[32px] flex-col w-full">
            <SettingsSectionHeader>Voice & Video</SettingsSectionHeader>
            <div className="">
                <TabBar>
                    {tabItems.map(ti => {
                        return (
                            <Tab key={ti.id} className={`${selectedTab.header === ti.header ? 'active' : ''}`}>
                                {ti.header}
                            </Tab>
                        );
                    })}
                </TabBar>
                <div className="mt-[24px]">
                    {selectedTab.content}
                </div>
            </div>
        </div>
    );
}

const SubHeader = styled.p`
    margin-bottom: 8px;
    font-weight: 500;
`

const InputSelect = styled.select`
    background-color: var(--input-background);
    border: 1px solid var(--input-border);
    border-radius: 8px;
    padding: 0 10px;
    min-height: 40px;

    &:focus {
        outline: none;
    }
`

const InputSlider = styled.input.attrs({ type: 'range' })`
  width: 100%;
  height: 3px;
  cursor: pointer;


  &::-webkit-slider-thumb {
    cursor: ew-resize;
  }

  &::-moz-range-thumb {
    cursor: ew-resize;
  }

  &::-ms-thumb {
    cursor: ew-resize;
  }
`;


const SliderBubble = styled.p`
    position: absolute;
    bottom: 100%;
    pointer-events: none;
    background: black;
    padding: 8px;
    border-radius: 6px;
    transform: translateX(-50%);
    margin-bottom: 6px;
    font-size: 14px;
    font-weight: 500;
`

function Slider({ min, max, value, onChange }: { min: number, max: number, value: number, onChange: (value: number) => void }) {
    const [showValue, setShowValue] = useState(false);


    return (
        <div className="relative">
            <InputSlider min={min} max={max}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                onMouseEnter={() => setShowValue(true)}
                onMouseLeave={() => setShowValue(false)}
            />
            {showValue && <SliderBubble style={{ left: `${value / max * 100}%` }}>{value}%</SliderBubble>}
        </div>
    )
}

function MicTestButton() {
    const [isRecording, setIsRecording] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioURL, setAudioURL] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);

    const cleanup = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (audioURL) {
            URL.revokeObjectURL(audioURL);
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return cleanup;
    }, [audioURL]);

    const startRecording = async () => {
        try {
            cleanup();
            const inputId = useAppSettingsStore.getState().mediaSettings.audioInputDeviceId;
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    deviceId: inputId ? { exact: inputId } : undefined
                }
            });

            streamRef.current = stream;

            chunksRef.current = [];

            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            recorder.onstop = () => {
                // Use the correct MIME type from the recorder
                const mimeType = recorder.mimeType || 'audio/webm';
                const blob = new Blob(chunksRef.current, { type: mimeType });
                const url = URL.createObjectURL(blob);
                setAudioURL(url);

                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop());
                    streamRef.current = null;
                }
            };

            recorder.start();
            setIsRecording(true);

            setTimeout(() => {
                if (recorder.state === 'recording') {
                    recorder.stop();
                    setIsRecording(false);
                }
            }, 3000);

        } catch (err) {
            console.error("Mic access error:", err);
            setIsRecording(false);
        }
    };

    const playRecording = () => {
        if (!audioURL) return;

        const audio = new Audio(audioURL);
        setIsPlaying(true);

        audio.onended = () => setIsPlaying(false);
        audio.onerror = () => {
            console.error('Audio playback error');
            setIsPlaying(false);
        };

        audio.play().catch(err => {
            console.error('Play error:', err);
            setIsPlaying(false);
        });
    };

    return (
        <div className="flex gap-4 items-center p-4">
            <button
                onClick={startRecording}
                disabled={isRecording}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 transition"
            >
                {isRecording ? "Recording..." : "Let's Check"}
            </button>

            {audioURL && (
                <button
                    onClick={playRecording}
                    disabled={isPlaying}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 transition"
                >
                    {isPlaying ? "Playing..." : "Replay"}
                </button>
            )}

            {isRecording && (
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-600">Recording for 3 seconds...</span>
                </div>
            )}
        </div>
    );
}

export default MicTestButton;

function VoiceSettingsTab() {
    const { mediaSettings, setAudioInputDevice, setAudioOutputDevice, setInputVolume, setOutputVolume } = useAppSettingsStore();
    const [devices, setDevices] = useState<MediaDeviceInfo[] | null>(null);

    useEffect(() => {

        const handleDeviceChange = async () => {
            const devices = await navigator.mediaDevices.enumerateDevices();
            setDevices(devices);
        }
        navigator.mediaDevices.enumerateDevices().then(dev => setDevices(dev));

        navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);

        return () => {
            navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
        }
    }, [])

    const inputDevices = devices?.filter(d => d.kind === "audioinput") || [];
    const outputDevices = devices?.filter(d => d.kind === "audiooutput") || [];


    return (
        <div className="flex flex-col gap-[16px]">
            <div className="flex gap-[16px] flex-col">
                <div className="flex gap-[16px]">
                    <div className="flex-1">
                        <SubHeader>Input Device</SubHeader>
                        <InputSelect
                            className="w-full p-2 border rounded"
                            value={mediaSettings.audioInputDeviceId}
                            onChange={(e) => setAudioInputDevice(e.target.value)}
                        >
                            {inputDevices.map(device => (
                                <option key={device.deviceId} value={device.deviceId}>
                                    {device.label || "Unnamed Input"}
                                </option>
                            ))}
                        </InputSelect>
                    </div>
                    <div className="flex-1">
                        <SubHeader>Output Device</SubHeader>
                        <InputSelect
                            className="w-full p-2 border rounded"
                            value={mediaSettings.audioOutputDeviceId}
                            onChange={(e) => setAudioOutputDevice(e.target.value)}
                        >
                            {outputDevices.map(device => (
                                <option key={device.deviceId} value={device.deviceId}>
                                    {device.label || "Unnamed Input"}
                                </option>
                            ))}
                        </InputSelect>
                    </div>
                </div>
                <div className="flex gap-[16px]">
                    <div className="flex-1">
                        <SubHeader>Input Volume</SubHeader>
                        <div className="relative">
                            <Slider min={MIN_VOLUME} max={MAX_VOLUME} value={mediaSettings.inputVolume} onChange={(value) => setInputVolume(Number(value))} />
                        </div>
                    </div>
                    <div className="flex-1">
                        <SubHeader>Output Volume</SubHeader>
                        <Slider min={MIN_VOLUME} max={MAX_VOLUME} value={mediaSettings.outputVolume} onChange={(value) => setOutputVolume(Number(value))} />
                    </div>
                </div>
                <div className="mt-6">
                    <SubHeader>Mic Test</SubHeader>
                    <MicTestButton />
                </div>
            </div>
        </div>
    );
}