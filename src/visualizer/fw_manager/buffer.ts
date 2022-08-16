import { MessageToOutside } from '../fourier_worker';
import { AbstractFourierWorkerManager, FrameData, AFWMConstructorArgs } from './abstract' 


enum CacheState {
    NOT_READY = 0, CALCULATING = 1, READY = 2
}

export type BFWMConstructorArgs = AFWMConstructorArgs & {
    cacheBufferDuration: number;
}


export class BufferFourierWorkerManager extends AbstractFourierWorkerManager {
    
    private lastRequestedIndex: number;
    private cacheDataArray: (FrameData | undefined)[];
    private cacheStateArray: CacheState[];


    constructor({ cacheBufferDuration, framerate, transformZoom = 1, customSampleRate }: BFWMConstructorArgs) {
        super({ framerate, transformZoom, customSampleRate })

        let bufferSize = Math.floor(cacheBufferDuration * framerate);
        this.cacheDataArray = new Array<FrameData | undefined>(bufferSize).fill(undefined);
        this.cacheStateArray = new Array<CacheState>(bufferSize).fill(CacheState.NOT_READY);
        this.lastRequestedIndex = 0;
    }


    setAudioBuffer(buffer: AudioBuffer) {
        super.setAudioBuffer(buffer);

        let bufferSize = this.cacheDataArray.length;
        let { sampleRate } = buffer;
        this.sampleRatePerFrame = sampleRate / this.framerate;
        this.bufferLengthPerFrame = this.customSampleRate ?? Math.pow(
            2, Math.floor(Math.log(this.sampleRatePerFrame) / Math.log(2))
        );

        for(let i = 0; i < bufferSize; i++) {
            this.cacheStateArray[i] = CacheState.CALCULATING;
            this.sendMessage(i);
        }
    }


    async getFrameData(index: number) : Promise<FrameData | undefined> {

        if(!this.audioBuffer)
            throw new Error('Tried to get frame data while no audio buffer is set');
        if(index < 0)
            throw new Error('Illegal index');

        let bufferSize = this.cacheDataArray.length;

        return new Promise<FrameData | undefined>((res, _) => {

            let { start, end, containsIndex } = this.getCalculationRequiredRange(index);

            let bufferIndex = index % bufferSize;
            if(containsIndex && this.cacheStateArray[bufferIndex] === CacheState.READY) {
                res(this.cacheDataArray[bufferIndex]);
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
            res(undefined);
        })
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

        let buffer = this.audioBuffer;
        let { numberOfChannels } = buffer;

        let lengthPerFrame = (this.bufferLengthPerFrame ?? 0);
        let bufferStartIndex = frameIndex * (this.sampleRatePerFrame ?? 0);
        let bufferEndIndex = bufferStartIndex + lengthPerFrame;

        let splitChannels = new Array(numberOfChannels).fill(0).map(
            bufferEndIndex > buffer.length ?
            (_, i) => new Float32Array(lengthPerFrame).map(
                (__, j) => buffer.getChannelData(i)[bufferStartIndex + j] ?? 0
            ) :
            (_, i) => buffer.getChannelData(i).slice(bufferStartIndex, bufferEndIndex)
        );
        
        this.worker?.postMessage({
            type: 'single',
            index: frameIndex,
            splitChannels,
            zoom: this.transformZoom
        })
    }

}