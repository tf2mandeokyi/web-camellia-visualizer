import { CustomFourierWorker, MessageToOutside } from '../fourier_worker';


export type AFWMConstructorArgs = {
    framerate: number;
    transformZoom?: number;
    customSampleRate?: number;
}


export interface FrameData {
    transformArray: Float32Array;
    volume: number;
}


export abstract class AbstractFourierWorkerManager {

    protected worker?: CustomFourierWorker;
    
    protected framerate: number;
    protected transformZoom: number;
    protected customSampleRate?: number;

    protected audioBuffer?: AudioBuffer;
    protected sampleRatePerFrame?: number;
    protected bufferLengthPerFrame?: number;

    constructor({ framerate, transformZoom = 1, customSampleRate }: AFWMConstructorArgs) {
        this.resetWorker();
        this.framerate = framerate;
        this.transformZoom = transformZoom;
        this.customSampleRate = customSampleRate;
    }
    
    protected resetWorker() {
        let oldWorker = this.worker;
        this.worker = new Worker(new URL('../fourier_worker', import.meta.url)) as CustomFourierWorker;
        this.worker.onmessage = this.handleWorkerMessage.bind(this);
        if(oldWorker) {
            oldWorker.terminate();
        }
    }

    setAudioBuffer(buffer: AudioBuffer) {
        this.audioBuffer = buffer;
    }

    isAudioBufferInserted() : boolean {
        return this.audioBuffer !== undefined;
    }

    abstract getFrameData(index: number) : Promise<FrameData | undefined>;

    protected abstract handleWorkerMessage({ data }: MessageEvent<MessageToOutside>) : void;
    protected abstract sendMessage(frameIndex: number) : void;
}