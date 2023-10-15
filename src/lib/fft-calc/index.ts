import { FastRealFourierTransform, blackmanHarris4, combineWindowedChannels } from "../fft";

export interface FrameData {
    transformArray: Float32Array;
    volume: number;
}


type FCConstructorArgs = {
    transformZoom?: number;
    sampleRatePerSecond?: number;
}


export class FourierCalculator {
    
    private transformZoom: number;
    private sampleRatePerSecond?: number;

    private audioBuffer?: AudioBuffer;
    /** Per second */
    private sampleRate?: number;
    private fourierObject?: FastRealFourierTransform;


    constructor({ transformZoom = 1, sampleRatePerSecond }: FCConstructorArgs) {
        this.transformZoom = transformZoom;
        this.sampleRatePerSecond = sampleRatePerSecond;
    }


    setAudioBuffer(buffer: AudioBuffer) {
        this.audioBuffer = buffer;

        let { sampleRate } = buffer;
        this.sampleRate = sampleRate;
        this.fourierObject = new FastRealFourierTransform(this.sampleRatePerSecond ?? 0, this.transformZoom);
    }


    isAudioBufferSet() : boolean {
        return this.audioBuffer !== undefined;
    }


    getRawData(timeMs: number) : Float32Array {
        if(!this.isAudioBufferSet())
            throw new Error('Tried to get frame data while no audio buffer is set');
        
        let splitChannels = this.getSplitChannelData(timeMs);
        return combineWindowedChannels(splitChannels, blackmanHarris4);
    }


    calculateData(rawData: Float32Array) : FrameData {
        if(!this.fourierObject)
            throw new Error('Tried to get frame data while no audio buffer is set');

        let transformArray = this.fourierObject.realTransform(rawData, 'radix-4');
        return { transformArray, volume: Math.max(...transformArray) };
    }


    protected getSplitChannelData(timeMs: number) : Float32Array[] {
        if(!this.audioBuffer)
            throw new Error('Tried to split channel data while no audio buffer is set');

        let buffer = this.audioBuffer;
        let { numberOfChannels } = buffer;

        let lengthPerFrame = (this.sampleRatePerSecond ?? 0);
        let bufferStartIndex = Math.floor(timeMs / 1000 * (this.sampleRate ?? 0)) - lengthPerFrame / 2;

        return new Array<number>(numberOfChannels).fill(0)
            .map((_, i) => new Float32Array(lengthPerFrame)
                .map((__, j) => buffer.getChannelData(i)[bufferStartIndex + j] ?? 0));
    }
}