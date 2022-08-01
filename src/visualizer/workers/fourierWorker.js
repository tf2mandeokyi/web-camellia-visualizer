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
 * @param { number } length 
 * @returns { { combined: Float32Array, volume: number } }
 */
function combineChannels(channels, startIndex, length) {
    const combined = new Float32Array(length);
    let min = +Infinity, max = -Infinity;

    for(let j = 0; j < length; ++j) {
        let temp = 0, index = startIndex + j, hanning;
        
        for(let channel of channels) {
            if(index < channel.length) {
                temp += channel[index];
            }
        }
        temp /= channels.length;

        hanning = Math.pow(Math.sin(Math.PI * j / length), 2)
        combined[j] = temp * hanning;

        if(min > temp) min = temp;
        if(max < temp) max = temp;
    }

    return { combined, volume: max - min }
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

    const fourierArray = fourierObject.realTransform(slicedBufferArray, 'radix-4');

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