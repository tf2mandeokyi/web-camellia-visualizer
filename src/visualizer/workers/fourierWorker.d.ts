declare type MessageWithType<T> = { type: T };

declare type EmptyMessage = MessageWithType<'empty'>;
declare type InputMessage = MessageWithType<'input'> & {
    channelsData: Float32Array[];
    sampleRate: number;
    dataArrayLength: number;
    framerate: number;
    customSampleRate?: number;
}
declare type StartedMessage = MessageWithType<'start'> & {
    arraySize: number;
}
declare type PartialResultMessage = MessageWithType<'part'> & {
    index: number;
    fourierTransform: Float32Array;
    volume: number;
}
declare type DoneMessage = MessageWithType<'done'>;


declare type MessageToWorker = InputMessage | EmptyMessage;
declare type MessageToOutside = StartedMessage | PartialResultMessage | DoneMessage | EmptyMessage;


declare type MessageHandlerFromInside = (this: DedicatedWorkerGlobalScope, ev: MessageEvent<MessageToWorker>) => any

export type MessageHandlerFromOutside = (this: Worker, ev: MessageEvent<MessageToOutside>) => any

export type CustomFourierWorker = Omit<Worker, 'onmessage' | 'postMessage'> & {
    onmessage: ((this: Worker, ev: MessageEvent<MessageToOutside>) => any) | null;
    postMessage(message: MessageToWorker, transfer: Transferable[]): void;
    postMessage(message: MessageToWorker, options?: PostMessageOptions): void;
}

// export function getWorker() : CustomFourierWorker;