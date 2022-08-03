declare type MessageWithType<T> = { type: T };

declare type EmptyMessage = MessageWithType<'empty'>;

// Messages to worker
declare type SingleArrayMessage = MessageWithType<'single'> & {
    index: number;
    waveData: Float32Array;
    zoom: number;
}
declare type SplitMessage = MessageWithType<'split'> & {
    channels: Float32Array[];
    length: number;
    sampleRate: number;
    framerate: number;
    customSampleRate?: number;
}
declare type MessageToWorker = SingleArrayMessage | SplitMessage | EmptyMessage;


// Messages to outside
declare type SplitResultMessage = MessageWithType<'split'> & {
    result: Float32Array[];
}
declare type SingleTransformResultMessage = MessageWithType<'single'> & {
    index: number;
    transformResult: Float32Array;
    volume: number;
}
declare type MessageToOutside = SplitResultMessage | SingleTransformResultMessage | EmptyMessage;


declare type MessageHandlerFromInside = (this: DedicatedWorkerGlobalScope, ev: MessageEvent<MessageToWorker>) => any

export type MessageHandlerFromOutside = (this: Worker, ev: MessageEvent<MessageToOutside>) => any

export type CustomFourierWorker = Omit<Worker, 'onmessage' | 'postMessage'> & {
    onmessage: ((this: Worker, ev: MessageEvent<MessageToOutside>) => any) | null;
    postMessage(message: MessageToWorker, transfer: Transferable[]): void;
    postMessage(message: MessageToWorker, options?: PostMessageOptions): void;
}