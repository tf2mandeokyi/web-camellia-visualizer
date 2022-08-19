import { AbstractFourierCalculator, AFCConstructorArgs, FrameData } from './abstract'

import { FastRealFourierTransform, blackmanHarris4, applyWindowFunction } from '../../fft/index.ts';

export class RealTimeFourierCalculator extends AbstractFourierCalculator {

    fourierObject?: FastRealFourierTransform;

    setAudioBuffer(buffer: AudioBuffer) {
        super.setAudioBuffer(buffer);
        this.fourierObject = new FastRealFourierTransform(this.bufferLengthPerFrame ?? 0, this.transformZoom);
    }

    getFrameData(index: number) : FrameData {
        
        if(!this.fourierObject)
            throw new Error('Tried to get frame data while no audio buffer is set');

        let splitChannels = this.getSplitChannelData(index);
        let { channelsCombined, volume } = applyWindowFunction(splitChannels, blackmanHarris4);
        let transformArray = this.fourierObject.realTransform(channelsCombined, 'radix-4');

        return { transformArray, volume };
    }

}