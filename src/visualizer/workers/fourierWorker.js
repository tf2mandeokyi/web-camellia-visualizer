/// <reference path="fourierWorker.d.ts"/>

const FFT = require('fft.js')


/**
 * @param { import('./fourierWorker').MessageToOutside } data
 * @param { Transferable[] | undefined } transfer
 */
function postmessage(data, transfer) {
    postMessage(data, transfer);
}


/**
 * 
 * @param { Float32Array[] } channels 
 * @param { number } startIndex 
 * @param { number } power 
 * @param { import('fft.js') } fourierObject 
 * @returns { fourierTransform: Float32Array, volume: number } 
 */
function step(channels, startIndex, power, fourierObject) {

    /** @type { number[] } */
    const slicedBufferArray = new Array(power);
    /** @type { number[] } */
    const fourierTransform = new Float32Array(power / 2);
    let min = +Infinity, max = -Infinity;

    for(let j = 0; j < power; ++j) {
        let temp = 0, index = Math.floor(startIndex + j);
        
        for(let channel of channels) {
            if(index < channel.length) {
                temp += channel[index];
            }
        }
        temp /= channels.length;
        slicedBufferArray[j] = temp;

        if(min > temp) min = temp;
        if(max < temp) max = temp;
    }
    const volume = power === 0 ? 0 : max - min;

    const fourierArray = fourierObject.createComplexArray();
    fourierObject.realTransform(fourierArray, slicedBufferArray);

    for(let j = 0; j < power / 2; ++j) {
        let re = fourierArray[2 * j], im = fourierArray[2 * j + 1];
        let dist = Math.sqrt(re*re + im*im);
        fourierTransform[j] = dist * 1024 / power;
    }

    return { fourierTransform, volume };
}


/** @type { import("./fourierWorker").MessageHandlerFromInside } */
onmessage = function(event) {
    let message = event.data;

    if(message.type === 'input') {
        let { channelsData, sampleRate, dataArrayLength, framerate, customSampleRate } = message;

        const sampleRatePerFrame = sampleRate / framerate;
        const frameCount = dataArrayLength / sampleRatePerFrame;
    
        const power = customSampleRate ?? Math.pow(2, Math.floor(Math.log(sampleRatePerFrame) / Math.log(2)));
        const fourierObject = new FFT(power);
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


// module.exports.getWorker = function() {
//     return new Worker(new URL('./fourierWorker.js', import.meta.url));
// }