/// <reference path="fourierWorker.d.ts"/>

const { FastRealFourierTransform } = require('../../fft/index.ts');


/**
 * @param { import('./fourierWorker').MessageToOutside } data
 * @param { Transferable[] | undefined } transfer
 */
function postmessage(data, transfer) {
    postMessage(data, transfer);
}


/**
 * @param { Float32Array[] } channels 
 * @param { number } startIndex 
 * @param { number } power 
 * @returns { { combined: Float32Array, volume: number } }
 */
function combineChannels(channels, startIndex, power) {
    const combined = new Float32Array(power);
    let min = +Infinity, max = -Infinity;

    for(let j = 0; j < power; ++j) {
        let temp = 0, index = startIndex + j;
        
        for(let channel of channels) {
            if(index < channel.length) {
                temp += channel[index];
            }
        }
        temp /= channels.length;
        combined[j] = temp;

        if(min > temp) min = temp;
        if(max < temp) max = temp;
    }

    return { combined, volume: max - min }
}


/**
 * @param { any[] } input 
 * @returns { Float32Array }
 */
function realifyComplexArray(input) {
    let length = input.length / 2;
    let result = new Float32Array(input.length / 2);

    for(let j = 0; j < length; ++j) {
        let re = input[2 * j], im = input[2 * j + 1];
        result[j] = Math.sqrt(re*re + im*im) * 1024 / length;
    }

    return result;
}


/**
 * 
 * @param { Float32Array[] } channels 
 * @param { number } startIndex 
 * @param { number } power 
 * @param { import('../../fft').FastRealFourierTransform } fourierObject 
 * @returns { {
 *     fourierTransform: Float32Array, 
 *     volume: number 
 * } }
 */
function step(channels, startIndex, power, fourierObject) {

    let { combined: slicedBufferArray, volume } = combineChannels(channels, startIndex, power);

    const fourierArray = fourierObject.realTransform(slicedBufferArray, 'radix-4')
        .map(e => e * 1024 / fourierObject.getSampleRate());

    return { fourierTransform: fourierArray, volume };
}


/** @type { import("./fourierWorker").MessageHandlerFromInside } */
onmessage = function(event) {
    let message = event.data;

    if(message.type === 'input') {
        let { channelsData, transformZoom, sampleRate, dataArrayLength, framerate, customSampleRate } = message;

        const sampleRatePerFrame = sampleRate / framerate;
        const frameCount = dataArrayLength / sampleRatePerFrame;
    
        const power = customSampleRate ?? Math.pow(2, Math.floor(Math.log(sampleRatePerFrame) / Math.log(2)));
        const fourierObject = new FastRealFourierTransform(power, transformZoom);
        const arraySize = Math.floor(frameCount);

        postmessage({ type: 'start', arraySize });
        for(let i = 0; i < arraySize; ++i) {
            let { fourierTransform, volume } = step(
                channelsData,
                Math.floor(i * sampleRatePerFrame),
                power, fourierObject
            )
            postmessage({ type: 'part', index: i, fourierTransform, volume });
        }
    
        postmessage({ type: 'done' });
    }
}