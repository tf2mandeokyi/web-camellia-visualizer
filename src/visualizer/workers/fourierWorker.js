/// <reference path="fourierWorker.d.ts"/>

const { FastRealFourierTransform, blackmanHarris4 } = require('../../fft/index.ts');


/**
 * @param { import('./fourierWorker').MessageToOutside } data
 * @param { Transferable[] | undefined } transfer
 */
function postmessage(data, transfer) {
    postMessage(data, transfer);
}


/**
 * @param { Float32Array[] } channels
 * @returns { { combined: Float32Array, volume: number } }
 */
function combineChannelsAndGetVolume(channels) {
    let length = channels[0].length;

    const combined = new Float32Array(length);
    let min = +Infinity, max = -Infinity;

    for(let j = 0; j < length; ++j) {
        let value = 0;
        
        for(let channel of channels) {
            if(j < channel.length) value += channel[j];
        }
        value /= channels.length;
        
        combined[j] = value * blackmanHarris4(length, j);
        if(min > value) min = value;
        if(max < value) max = value;
    }

    return { combined, volume: max - min }
}


/** @type { import("./fourierWorker").MessageHandlerFromInside } */
onmessage = function(event) {
    let message = event.data;

    if(message.type === 'single') {
        let { index, splitChannels, zoom } = message;

        let { combined, volume } = combineChannelsAndGetVolume(splitChannels);

        const fourierObject = new FastRealFourierTransform(combined.length, zoom);
        let transformResult = fourierObject.realTransform(combined, 'radix-4');

        postmessage({ type: 'single', index, transformResult, volume });
    }
}