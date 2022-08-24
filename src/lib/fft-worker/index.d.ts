declare type MessageWithType<T> = { type: T };

declare type EmptyMessage = MessageWithType<'empty'>;

// Messages to worker
declare type InitializeMessage = MessageWithType<'init'> & {
    size: number;
    zoom: number;
}
declare type SingleArrayMessage = MessageWithType<'single'> & {
    index: number;
    splitChannels: Float32Array[];
}
declare type MessageToWorker = InitializeMessage | SingleArrayMessage | EmptyMessage;


// Messages to outside
declare type SingleTransformResultMessage = MessageWithType<'single'> & {
    index: number;
    transformResult: Float32Array;
    volume: number;
}
declare type MessageToOutside = SingleTransformResultMessage | EmptyMessage;


declare type MessageHandlerFromInside = (this: DedicatedWorkerGlobalScope, ev: MessageEvent<MessageToWorker>) => any

export type MessageHandlerFromOutside = (this: Worker, ev: MessageEvent<MessageToOutside>) => any

export type CustomFourierWorker = Omit<Worker, 'onmessage' | 'postMessage'> & {
    onmessage: ((this: Worker, ev: MessageEvent<MessageToOutside>) => any) | null;
    postMessage(message: MessageToWorker, transfer: Transferable[]): void;
    postMessage(message: MessageToWorker, options?: PostMessageOptions): void;
}