
interface LocalAudioDeps {
    onSpeakingChange: (speaking: boolean) => void;
    isMicOff(): boolean;
}

export class LocalAudio {
    public get track(): MediaStreamTrack { return this._track!; }

    private _track?: MediaStreamTrack;
    private audioContext: AudioContext = new AudioContext();
    private analyser = this.audioContext.createAnalyser();
    private source?: MediaStreamAudioSourceNode;
    private dataArray: Float32Array<ArrayBuffer>;
    private speaking = false;
    private lastSpokeTime = 0;
    private SPEAK_THRESHOLD = 0.01;
    private STOP_DELAY = 300;

    private stopped: boolean = false;
    private loopId?: number;

    private constructor(private readonly deps: LocalAudioDeps) {
        this.analyser.fftSize = 2048;
        this.dataArray = new Float32Array(this.analyser.fftSize);
    }
    static async start(deviceId: string | undefined, deps: LocalAudioDeps): Promise<LocalAudio> {
        const localAudio = new LocalAudio(deps);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    deviceId: deviceId ? { ideal: deviceId } : undefined,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            if (localAudio.audioContext.state === 'suspended') await localAudio.audioContext.resume();

            const track = stream.getAudioTracks()[0];
            if (!track) throw new Error('No audio track found in stream');

            localAudio._track = track;
            localAudio.source = localAudio.audioContext.createMediaStreamSource(stream);
            localAudio.source.connect(localAudio.analyser);


            localAudio.loopId = requestAnimationFrame(localAudio.tick);

            return localAudio;
        } catch (error) {
            localAudio.stop();
            throw (error);
        }
    }

    async switchDevice(deviceId: string) {
        if (this.stopped) throw new Error('LocalAudio stopped');

        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                deviceId: { ideal: deviceId },
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            }
        });

        const newSource = this.audioContext.createMediaStreamSource(stream);
        newSource.connect(this.analyser);

        this.source?.disconnect();
        this._track?.stop();

        this._track = stream.getAudioTracks()[0];
        this.source = newSource;

        return this._track;
    }

    private tick = () => {
        if (this.deps.isMicOff()) {
            if (this.speaking) {
                this.speaking = false;
                this.deps.onSpeakingChange(false);
            }
            this.loopId = requestAnimationFrame(this.tick);
            return;
        }
        this.analyser.getFloatTimeDomainData(this.dataArray);

        let sum = 0;
        for (let i = 0; i < this.dataArray.length; i++) {
            sum += this.dataArray[i] * this.dataArray[i];
        }
        const rms = Math.sqrt(sum / this.dataArray.length);

        const now = Date.now();
        if (rms > this.SPEAK_THRESHOLD) {
            this.lastSpokeTime = now;
            if (!this.speaking) {
                this.speaking = true;

                this.deps.onSpeakingChange(true);
            }
        } else {
            if (this.speaking && now - this.lastSpokeTime > this.STOP_DELAY) {
                this.speaking = false;
                this.deps.onSpeakingChange(false);
            }
        }

        this.loopId = requestAnimationFrame(this.tick);
    }

    stop() {
        if (this.stopped) return;

        this.stopped = true;
        if (this.loopId) cancelAnimationFrame(this.loopId);
        this.audioContext.close().catch(() => { });
        this.source?.disconnect();
        this._track?.stop();
    }
}