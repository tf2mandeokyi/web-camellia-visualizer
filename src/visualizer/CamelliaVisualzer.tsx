import { useEffect, useState, useRef, useCallback } from 'react';
import { FillStrokeColor } from './FillStrokeColor'
import ImageTemplate from './ImageTemplate'
import AudioSpectrum from './spectrum/AudioSpectrum';
import ProgressBar from './ProgressBar';
import parseAudioBuffer from '../util/parseAudioBuffer';

import './CamelliaVisualzer.css'


const audioContext = new AudioContext();
const emptyArrayOnDisplay = [0, 0];


interface CamelliaVisualzerProps {
    defaultColor: FillStrokeColor;
    curveSpectrum?: Partial<FillStrokeColor>;
    barSpectrum?: Partial<FillStrokeColor>;
    progressBar?: Partial<FillStrokeColor>;
    framerate: number;
}


function mergeColor(color: Partial<FillStrokeColor> | undefined, defaultColor: FillStrokeColor) : FillStrokeColor {
    if(color === undefined || color === null) return defaultColor; 
    return {
        fill: color.fill ?? defaultColor.fill,
        stroke: color.stroke ?? defaultColor.stroke,
        lineWidth: color.lineWidth ?? defaultColor.lineWidth
    };
}


const CamelliaVisualzer : React.FC<CamelliaVisualzerProps> = (props) => {


    const [ windowSize, setWindowSize ] = useState({ width: window.innerWidth, height: window.innerHeight });
    const [ audioBuffer, setAudioBuffer ] = useState<AudioBuffer>();
    const [ parsedArray, setParsedArray ] = useState<number[][]>();
    const [ arrayOnDisplay, setArrayOnDisplay ] = useState(emptyArrayOnDisplay);
    const [ frameNumber, setFrameNumber ] = useState<number>(0);
    const [ playSound, setPlaySound ] = useState<AudioBufferSourceNode>();
    const [ processing, setProcessingState ] = useState<boolean>(false);
    const [ play, setPlay ] = useState<boolean>(false);
    const [ loopStart, setLoopStart ] = useState<number>();
    const [ nextLoopAt, setNextLoopAt ] = useState<number>(0);

    const inputFileRef = useRef<HTMLInputElement>(null);
    const startButtonRef = useRef<HTMLInputElement>(null);
    const requestId = useRef<number>();
    

    const loop = useCallback(() => {
        // =================
        if(play) {
            var next = nextLoopAt;
            const now = new Date().getTime();
            if (!loopStart) {
                setLoopStart(now);
                next = now + 1000 / props.framerate;
                setNextLoopAt(next);
            }
            if(now >= next) {
                next += 1000 / props.framerate;
                setNextLoopAt(next);
                var array = parsedArray?.[frameNumber];
                if(!array) {
                    array = emptyArrayOnDisplay;
                    setFrameNumber(0);
                    setPlay(false);
                    setLoopStart(undefined);
                }
                else {
                    setFrameNumber(frameNumber + 1);
                }
                setArrayOnDisplay(array);
            }
        }
        // =================
        requestId.current = requestAnimationFrame(loop);
    }, [ props, play, parsedArray, frameNumber, loopStart, nextLoopAt ])


    const onFileSelection = useCallback(async () => {
        setProcessingState(true);
        try {
            const buffer = await inputFileRef.current?.files?.[0]?.arrayBuffer();
            if(!buffer) { setProcessingState(false); return; }

            const decoded = await audioContext.decodeAudioData(buffer);
            if(!decoded) { setProcessingState(false); return; }
            setAudioBuffer(decoded);

            const parsed = parseAudioBuffer(decoded, props.framerate);
            if(!parsed) { setProcessingState(false); return; }
            setParsedArray(parsed);
            setProcessingState(false);
        } catch(e) {
            console.error(e);
        }
    }, [ props ]);


    const onClickStart = () => {
        if(!processing && !play && audioBuffer && parsedArray) {
            const bufferSource = audioContext.createBufferSource();
            bufferSource.buffer = audioBuffer;
            bufferSource.connect(audioContext.destination);
            bufferSource.start(0);

            setPlaySound(bufferSource);
            setPlay(true);
        }
    }


    const handleResize = () => {
        setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    }


    useEffect(() => {
        window.addEventListener('resize', handleResize);
        loop();
        return () => {
            window.removeEventListener('resize', handleResize);
            if(requestId.current) cancelAnimationFrame(requestId.current);
        }
    }, [ loop ]);


    return (<>
        <div className="camellia-visualzer">
            <input 
                id="audio_input" 
                ref={ inputFileRef } 
                type="file" accept="audio/*" 
                onInput={ onFileSelection }
            /><br/>
            { processing ? "Processing..." : "​" }<br/>
            <input
                id="start_button" 
                ref={ startButtonRef }
                type="button" 
                value="START"
                onClick={ onClickStart }
            />
            <ImageTemplate
                right={windowSize.width / 2 + 86}
                bottom={windowSize.height / 2 - 197}
                width={ 648 }
                height={ 648 }
            />
            <AudioSpectrum 
                arrayOnDisplay={ arrayOnDisplay }
                curveColor={ mergeColor(props.curveSpectrum, props.defaultColor) }
                barColor={ mergeColor(props.barSpectrum, props.defaultColor) }
                left={ windowSize.width / 2 - 44 }
                width={ 777 }
                bottom={ windowSize.height / 2 + 175 }
                zoom={ 28 }
                waveScale={ 4 }
            />
            <ProgressBar
                color={ mergeColor(props.progressBar, props.defaultColor) }
                left={ windowSize.width / 2 - 40 }
                width={ 776 }
                y={ windowSize.height / 2 + 194 }
                current={ frameNumber }
                total={ parsedArray?.length ?? 0 }
            />
        </div>
    </>);
}

export default CamelliaVisualzer;
  