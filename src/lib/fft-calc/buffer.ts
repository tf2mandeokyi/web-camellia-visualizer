import { MessageToOutside } from '../fft-worker';
import { AbstractFourierWorkerCalculator, FrameData, AFCConstructorArgs } from './abstract' 


enum CacheState {
    NOT_READY = 0, CALCULATING = 1, READY = 2
}

export type BFCConstructorArgs = AFCConstructorArgs & {
    cacheBufferDuration: number;
}


export class BufferedFourierCalculator extends AbstractFourierWorkerCalculator {
    
    private lastRequestedIndex: number;
    private cacheDataArray: (FrameData | undefined)[];
    private cacheStateArray: CacheState[];


    constructor({ cacheBufferDuration, framerate, transformZoom = 1, customSampleRate }: BFCConstructorArgs) {
        super({ framerate, transformZoom, customSampleRate })

        let bufferSize = Math.floor(cacheBufferDuration * framerate);
        this.cacheDataArray = new Array<FrameData | undefined>(bufferSize).fill(undefined);
        this.cacheStateArray = new Array<CacheState>(bufferSize).fill(CacheState.NOT_READY);
        this.lastRequestedIndex = 0;
    }


    setAudioBuffer(buffer: AudioBuffer) {
        super.setAudioBuffer(buffer);

        for(let i = 0; i < this.cacheDataArray.length; i++) {
            this.cacheStateArray[i] = CacheState.CALCULATING;
            this.sendMessage(i);
        }
    }


    getFrameData(index: number) : FrameData | undefined {

        if(!this.audioBuffer)
            throw new Error('Tried to get frame data while no audio buffer is set');
        if(index < 0)
            throw new Error('Illegal index');

        let bufferSize = this.cacheDataArray.length;
        let { start, end, containsIndex } = this.getCalculationRequiredRange(index);

        let bufferIndex = index % bufferSize;
        let result: FrameData | undefined = undefined;
        if(containsIndex && this.cacheStateArray[bufferIndex] === CacheState.READY) {
            result = this.cacheDataArray[bufferIndex];
        }

        if(!containsIndex) {
            this.resetWorker();
        }
        if(end >= start) {
            for(let i = start; i <= end; i++) {
                bufferIndex = i % bufferSize;
                this.cacheStateArray[bufferIndex] = CacheState.CALCULATING;
                this.sendMessage(i);
            }
        }

        this.lastRequestedIndex = index;
        return result;
    }


    private getCalculationRequiredRange(index: number) {
        let bufferSize = this.cacheDataArray.length;

        let start = 0, end = -1, containsIndex: boolean = false;
        if(index <= this.lastRequestedIndex - bufferSize) {
            start = index; end = index + bufferSize - 1;
        }
        else if(index < this.lastRequestedIndex) {
            start = index; end = this.lastRequestedIndex - 1;
        }
        else if(index === this.lastRequestedIndex) {
            containsIndex = true;
        }
        else if(index < this.lastRequestedIndex + bufferSize) {
            containsIndex = true;
            start = this.lastRequestedIndex + bufferSize; end = index + bufferSize - 1;
        }
        else {
            start = index; end = index + bufferSize - 1;
        }

        return { start, end, containsIndex };
    }


    protected handleWorkerMessage({ data }: MessageEvent<MessageToOutside>) {
        let bufferSize = this.cacheDataArray.length;

        if(data.type === 'single') {
            let { index, transformResult, volume } = data;

            if(index < this.lastRequestedIndex || index >= this.lastRequestedIndex + bufferSize) {
                return;
            }
            let bufferIndex = index % bufferSize;
            this.cacheDataArray[bufferIndex] = { transformArray: transformResult, volume };
            this.cacheStateArray[bufferIndex] = CacheState.READY;
        }
    }


    protected sendMessage(frameIndex: number) {
        if(!this.audioBuffer)
            throw new Error('Tried to send message to worker while no audio buffer is set');

        this.worker?.postMessage({
            type: 'single',
            index: frameIndex,
            splitChannels: this.getSplitChannelData(frameIndex),
            zoom: this.transformZoom
        })
    }

}