/// <reference path="fourierWorker.d.ts"/>

const { FastRealFourierTransform } = require('../../fft/index.ts');


/**
 * @param { import('./fourierWorker').MessageToOutside } data
 * @param { Transferable[] | undefined } transfer
 */
function postmessage(data, transfer) {
    postMessage(data, transfer);
}


const DEFAULT_BMHARRIS = [ 0.35875, 0.48829, 0.14128, 0.01168 ];
/**
 * @param { number } N 
 * @param { number } n
 */
function blackmanHarris4(N, n, [ a0, a1, a2, a3 ] = DEFAULT_BMHARRIS) {
    let w = 2 * Math.PI * n / (N-1);
    return a0 - a1*Math.cos(w) + a2*Math.cos(2*w) - a3*Math.cos(3*w);
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
        let temp = 0, index = startIndex + j;
        
        for(let channel of channels) {
            if(index < channel.length) {
                temp += channel[index];
            }
        }
        combined[j] = temp / channels.length;

        if(min > temp) min = temp;
        if(max < temp) max = temp;
    }

    return { combined, volume: max - min }
}


/**
 * @param { Float32Array } waveData
 * @returns { number }
 */
function getVolumeFromWave(waveData) {
    let min = +Infinity, max = -Infinity;

    for(let value of waveData) {
        if(min > value) min = value;
        if(max < value) max = value;
    }

    return max - min;
}


/**
 * @param { Float32Array } waveData
 * @returns { Float32Array }
 */
function applyWindowFunction(waveData) {
    return waveData.map((e, i) => e * blackmanHarris4(waveData.length, i));
}


/** @type { import("./fourierWorker").MessageHandlerFromInside } */
onmessage = function(event) {
    let message = event.data;

    if(message.type === 'split') {
        let { channels, length, sampleRate, framerate, customSampleRate } = message;

        const sampleRatePerFrame = sampleRate / framerate;
        const frameCount = Math.floor(length / sampleRatePerFrame);

        /** @type { Float32Array[] } */
        let result = new Array(frameCount);
        const arrayLengthPerFrame = customSampleRate ?? Math.pow(
            2, Math.floor(Math.log(sampleRatePerFrame) / Math.log(2))
        );

        for(let i = 0; i < frameCount; ++i) {
            let { combined } = combineChannels(
                channels, Math.floor(i * sampleRatePerFrame), arrayLengthPerFrame
            )
            result[i] = combined;
        }
        postmessage({ type: 'split', result });
    }
    else if(message.type === 'single') {
        let { index, waveData, zoom } = message;

        let volume = getVolumeFromWave(waveData);

        /** @type { import('../../fft').FastRealFourierTransform } */
        const fourierObject = new FastRealFourierTransform(waveData.length, zoom);
        let transformResult = fourierObject.realTransform(applyWindowFunction(waveData), 'radix-4');

        postmessage({ type: 'single', index, transformResult, volume });
    }
}