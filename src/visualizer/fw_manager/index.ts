import { BFWMConstructorArgs, BufferFourierWorkerManager } from "./buffer";


interface FourierWorkerMethodMap {
    'buffer': BufferFourierWorkerManager
}
interface FourierWorkerMethodArgsMap {
    'buffer': BFWMConstructorArgs
}

export { AbstractFourierWorkerManager } from './abstract';

export function fromMethod<T extends keyof FourierWorkerMethodMap>(
    methodType: T,
    args: FourierWorkerMethodArgsMap[T]
) : FourierWorkerMethodMap[T] {
    if(methodType === 'buffer') {
        return new BufferFourierWorkerManager(args);
    }
    else {
        throw new Error(`No worker manager found with method type name ${methodType}`)
    }
}