
import { useAppSettingsStore } from "@/app/stores/app-settings-store";
import { SoundType, useAudioStore } from "@/app/stores/audio-store";
import { useEffect, useRef } from 'react';

const soundMap: Record<SoundType, { src: string; loop: boolean }> = {
  ring: { src: '/assets/ring.mp3', loop: true },
  call: { src: '/assets/call.mp3', loop: true },
  mention: { src: '/sounds/mention.mp3', loop: false },
  message: { src: '/sounds/message.mp3', loop: false },
  "voice-leave": { src: '/assets/voice-leave.mp3', loop: false },
  "voice-join": { src: '/assets/voice-join.mp3', loop: false },
  "audio-test": { src: '/assets/audio-test.mp3', loop: false }

};

export default function AudioManager() {
  const audioRefs = useRef<Record<SoundType, HTMLAudioElement>>({} as Record<SoundType, HTMLAudioElement>);

  useEffect(() => {
    for (const [type, { src, loop }] of Object.entries(soundMap) as [SoundType, { src: string; loop: boolean }][]) {
      const audio = new Audio(src);
      audio.loop = loop;
      audioRefs.current[type] = audio;
    }

    useAudioStore.setState({
      playSound: async (type: SoundType) => {
        const audio = audioRefs.current[type];
        const mediaSettings = useAppSettingsStore.getState().mediaSettings;
        if (!audio) return;
        audio.volume = mediaSettings.outputVolume / 100;
        audio.currentTime = 0;
        audio.play().catch(console.error);
      },
      stopSound: (type: SoundType) => {
        const audio = audioRefs.current[type];
        if (!audio) return;
        audio.pause();
        audio.currentTime = 0;
      },
    });
  }, []);

  return null;
}
