import { AbstractFourierCalculator, AFCConstructorArgs } from "./abstract";
import { BFCConstructorArgs, BufferedFourierCalculator } from "./buffer";
import { RealTimeFourierCalculator } from './real_time';

export { AbstractFourierCalculator } from './abstract';


interface MethodArgsType {
    "buffer": BFCConstructorArgs;
    "real-time": AFCConstructorArgs;
}

export function fromMethod<T extends keyof MethodArgsType>(
    methodType: T, args: MethodArgsType[T]
) : AbstractFourierCalculator {
    if(methodType === 'buffer') {
        return new BufferedFourierCalculator(args as BFCConstructorArgs);
    }
    else if(methodType === 'real-time') {
        return new RealTimeFourierCalculator(args);
    }
    else {
        throw new Error(`No worker manager found with method type name ${methodType}`)
    }
}