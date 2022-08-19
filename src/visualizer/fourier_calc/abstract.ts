import { CustomFourierWorker, MessageToOutside } from '../fourier_worker';


export type AFCConstructorArgs = {
    framerate: number;
    transformZoom?: number;
    customSampleRate?: number;
}


export interface FrameData {
    transformArray: Float32Array;
    volume: number;
}


export abstract class AbstractFourierCalculator {
    
    protected framerate: number;
    protected transformZoom: number;
    protected customSampleRate?: number;

    protected audioBuffer?: AudioBuffer;
    protected sampleRatePerFrame?: number;
    protected bufferLengthPerFrame?: number;


    constructor({ framerate, transformZoom = 1, customSampleRate }: AFCConstructorArgs) {
        this.framerate = framerate;
        this.transformZoom = transformZoom;
        this.customSampleRate = customSampleRate;
    }


    setAudioBuffer(buffer: AudioBuffer) {
        this.audioBuffer = buffer;

        let { sampleRate } = buffer;
        this.sampleRatePerFrame = sampleRate / this.framerate;
        this.bufferLengthPerFrame = this.customSampleRate ?? Math.pow(
            2, Math.floor(Math.log(this.sampleRatePerFrame) / Math.log(2))
        );
    }


    isAudioBufferSet() : boolean {
        return this.audioBuffer !== undefined;
    }


    abstract getFrameData(index: number) : FrameData | undefined;


    protected getSplitChannelData(frameIndex: number) : Float32Array[] {
        if(!this.audioBuffer)
            throw new Error('Tried to split channel data while no audio buffer is set');

        let buffer = this.audioBuffer;
        let { numberOfChannels } = buffer;

        let lengthPerFrame = (this.bufferLengthPerFrame ?? 0);
        let bufferStartIndex = frameIndex * (this.sampleRatePerFrame ?? 0);
        let bufferEndIndex = bufferStartIndex + lengthPerFrame;

        return new Array(numberOfChannels).fill(0).map(
            bufferEndIndex > buffer.length ?
            (_, i) => new Float32Array(lengthPerFrame).map(
                (__, j) => buffer.getChannelData(i)[bufferStartIndex + j] ?? 0
            ) :
            (_, i) => buffer.getChannelData(i).slice(bufferStartIndex, bufferEndIndex)
        );
    }
}


export abstract class AbstractFourierWorkerCalculator extends AbstractFourierCalculator {

    protected worker?: CustomFourierWorker;
    
    constructor(options: AFCConstructorArgs) {
        super(options);
        this.resetWorker();
    }

    protected resetWorker() {
        let oldWorker = this.worker;
        this.worker = new Worker(new URL('../fourier_worker', import.meta.url)) as CustomFourierWorker;
        this.worker.onmessage = this.handleWorkerMessage.bind(this);
        if(oldWorker) {
            oldWorker.terminate();
        }
    }

    protected abstract handleWorkerMessage({ data }: MessageEvent<MessageToOutside>) : void;
}