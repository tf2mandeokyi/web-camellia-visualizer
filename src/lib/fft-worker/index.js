/// <reference path="index.d.ts"/>

const { FastRealFourierTransform, blackmanHarris4, applyWindowFunction } = require('../fft/index.ts');


/**
 * @param { import('.').MessageToOutside } data
 * @param { Transferable[] | undefined } transfer
 */
function postmessage(data, transfer) {
    postMessage(data, transfer);
}


/** @type { FastRealFourierTransform } */
let fourierObject = undefined;


/** @type { import(".").MessageHandlerFromInside } */
onmessage = function(event) {
    let message = event.data;

    if(message.type === 'init') {
        let { size, zoom } = message;

        fourierObject = new FastRealFourierTransform(size, zoom);
    }
    else if(message.type === 'single') {
        if(!fourierObject) throw new Error('Fourier transform object not initialized')
        
        let { index, splitChannels } = message;

        let { channelsCombined, volume } = applyWindowFunction(splitChannels, blackmanHarris4);
        let transformResult = fourierObject.realTransform(channelsCombined, 'radix-4');

        postmessage({ type: 'single', index, transformResult, volume });
    }
}