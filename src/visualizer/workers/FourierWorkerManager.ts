import { CustomFourierWorker, MessageToOutside } from './fourierWorker';


interface FrameData {
    transformArray: Float32Array;
    volume: number;
}

enum BufferState {
    NOT_READY = 0, CALCULATING = 1, READY = 2
}

export class FourierWorkerManager {

    private worker: CustomFourierWorker;

    private splitChannelBuffer?: Float32Array[];
    private framerate: number;
    private transformZoom: number;
    
    private ready: boolean;
    private lastFetchedIndex: number;
    private transformBuffer: (FrameData | undefined)[];
    private bufferStateArray: BufferState[];


    constructor(duration: number, framerate: number, transformZoom = 1) {
        let worker = new Worker(new URL('./fourierWorker.js', import.meta.url)) as CustomFourierWorker;
        worker.onmessage = this.handleWorkerMessage.bind(this);
        this.worker = worker;
        this.framerate = framerate;
        this.transformZoom = transformZoom;

        let bufferSize = Math.floor(duration * framerate);
        this.transformBuffer = new Array<FrameData | undefined>(bufferSize).fill(undefined);
        this.bufferStateArray = new Array<BufferState>(bufferSize).fill(BufferState.NOT_READY);
        this.lastFetchedIndex = 0;
        this.ready = true;
    }


    setAudioBuffer(buffer: AudioBuffer) {
        let bufferSize = this.transformBuffer.length;
        let { numberOfChannels, sampleRate, length } = buffer;

        for(let i = 0; i < bufferSize; i++) {
            this.bufferStateArray[i] = BufferState.NOT_READY;
        }
        this.ready = false;
        this.worker.postMessage({
            type: 'split',
            channels: new Array(numberOfChannels).fill(0).map((_, i) => buffer.getChannelData(i)),
            length, sampleRate, framerate: this.framerate,
            customSampleRate: 2048
        })
    }


    isAudioInserted() : boolean {
        return this.splitChannelBuffer !== undefined;
    }


    isReady() {
        return this.ready;
    }


    async getFrameData(index: number) : Promise<FrameData | undefined> {

        if(!this.splitChannelBuffer)
            throw new Error('Tried to get frame data while no audio buffer is set');
        if(index < 0 || index >= this.splitChannelBuffer.length)
            throw new Error('Illegal index');

        let bufferSize = this.transformBuffer.length;

        return new Promise<FrameData | undefined>((res, _) => {

            let start = 0, end = -1, containsIndex: boolean = false;
            if(index <= this.lastFetchedIndex - bufferSize) {
                start = index; end = index + bufferSize - 1;
            }
            else if(index < this.lastFetchedIndex) {
                start = index; end = this.lastFetchedIndex - 1;
            }
            else if(index === this.lastFetchedIndex) {
                containsIndex = true;
            }
            else if(index < this.lastFetchedIndex + bufferSize) {
                containsIndex = true;
                start = this.lastFetchedIndex + bufferSize; end = index + bufferSize - 1;
            }
            else {
                start = index; end = index + bufferSize - 1;
            }

            let bufferIndex = index % bufferSize;
            if(containsIndex && this.bufferStateArray[bufferIndex] === BufferState.READY) {
                res(this.transformBuffer[bufferIndex]);
            }

            for(let i = start; i <= end; i++) {
                bufferIndex = i % bufferSize;
                this.bufferStateArray[bufferIndex] = BufferState.CALCULATING;
                this.sendMessage(i);
            }
            this.lastFetchedIndex = index;
            res(undefined);
        })
    }


    private handleWorkerMessage({ data }: MessageEvent<MessageToOutside>) {
        let bufferSize = this.transformBuffer.length;

        if(data.type === 'split') {
            this.splitChannelBuffer = data.result;
            this.ready = true;
            for(let i = 0; i < bufferSize; ++i) {
                this.bufferStateArray[i] = BufferState.CALCULATING;
                this.sendMessage(i);
            }
        }
        else if(data.type === 'single') {
            let { index, transformResult, volume } = data;

            if(index < this.lastFetchedIndex || index >= this.lastFetchedIndex + bufferSize) {
                return;
            }
            let bufferIndex = index % bufferSize;
            this.transformBuffer[bufferIndex] = { transformArray: transformResult, volume };
            this.bufferStateArray[bufferIndex] = BufferState.READY;
        }
    }


    private sendMessage(frameIndex: number) {
        if(!this.splitChannelBuffer)
            throw new Error('Tried to send message to worker while no audio buffer is set');

        this.worker.postMessage({
            type: 'single',
            index: frameIndex,
            waveData: this.splitChannelBuffer[frameIndex],
            zoom: this.transformZoom
        })
    }
}