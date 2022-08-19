/// <reference path="index.d.ts"/>

const { FastRealFourierTransform, blackmanHarris4, applyWindowFunction } = require('../../fft/index.ts');


/**
 * @param { import('.').MessageToOutside } data
 * @param { Transferable[] | undefined } transfer
 */
function postmessage(data, transfer) {
    postMessage(data, transfer);
}


/** @type { import(".").MessageHandlerFromInside } */
onmessage = function(event) {
    let message = event.data;

    if(message.type === 'single') {
        let { index, splitChannels, zoom } = message;

        let { channelsCombined, volume } = applyWindowFunction(splitChannels, blackmanHarris4);

        const fourierObject = new FastRealFourierTransform(channelsCombined.length, zoom);
        let transformResult = fourierObject.realTransform(channelsCombined, 'radix-4');

        postmessage({ type: 'single', index, transformResult, volume });
    }
}