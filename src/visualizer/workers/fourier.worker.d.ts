declare type MessageWithType<T> = { type: T };

declare type InputMessage = MessageWithType<'input'> & {
    channelsData: Float32Array[];
    sampleRate: number;
    dataArrayLength: number;
    // bufferWrapper: Wrapper<AudioBuffer>;
    framerate: number;
    customSampleRate?: number;
}
declare type ResultMessage = MessageWithType<'result'> & {
    transformArray: number[][];
    volumeArray: number[];
}
declare type ProgressMessage = MessageWithType<'progress'> & {
    current: number;
    total: number;
}


declare type MessageToWorker = InputMessage;
declare type MessageToOutside = ResultMessage | ProgressMessage;


declare type MessageHandlerFromInside = (this: any, ev: MessageEvent<MessageToWorker>) => any
export type MessageHandlerFromOutside = (this: Worker, ev: MessageEvent<MessageToOutside>) => any

export type CustomWorker = Omit<Worker, 'onmessage' | 'postMessage'> & {
    onmessage: ((this: Worker, ev: MessageEvent<MessageToOutside>) => any) | null;
    postMessage(message: MessageToWorker, transfer: Transferable[]): void;
    postMessage(message: MessageToWorker, options?: PostMessageOptions): void;
}

export function getWorker() : CustomWorker;