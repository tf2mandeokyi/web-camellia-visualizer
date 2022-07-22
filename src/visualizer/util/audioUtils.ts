import FFT from 'fft.js';


/**
 * Uses lerp (linear interpolation) for now.
 * @todo Change function to cubic or whatever
 * @param t between 0 and 1
 */
export function interpolate(y0: number, y1: number, t: number) {
    return y0 + t * (y1 - y0);
}


export function parseAudioBuffer(buffer: AudioBuffer, framerate: number) : number[][] {

    const { numberOfChannels, sampleRate, length } = buffer;
    const sampleRatePerFrame = sampleRate / framerate;
    const frameCount = length / sampleRatePerFrame;

    const channels = new Array(numberOfChannels).fill(0).map((_, i) => buffer.getChannelData(i));

    const power = Math.pow(2, Math.floor(Math.log(sampleRatePerFrame) / Math.log(2)));
    const fourierObject = new FFT(power);

    return new Array(Math.floor(frameCount))
            .fill(0)
            .map((_, i) => {
                const data = new Array(power);
                let index, j;
                for(j = 0; j < power; ++j) {
                    data[j] = 0;
                    index = i * sampleRatePerFrame + j;
                    for(let channel of channels) {
                        if(index < length) {
                            data[j] += channel[index];
                        }
                    }
                    data[j] /= channels.length;
                }
                const out = fourierObject.createComplexArray();
                fourierObject.realTransform(out, data);
                const result = new Array(power / 2);
                for(j = 0; j < power / 2; ++j) {
                    let re = out[2 * j], im = out[2 * j + 1];
                    let dist = Math.sqrt(re*re + im*im);
                    result[j] = dist;
                }
                return result;
            });
}