import { useEffect, useState, useRef, useCallback } from 'react';
import { FillStrokeColor } from './FillStrokeColor'
import { parseAudioBuffer } from './util/audioUtils';
import Background from './image/Background'
import AlbumCover, { AlbumCoverClickHandler } from './image/AlbumCover'
import AudioSpectrum from './spectrum/AudioSpectrum';
import ProgressBar, { ProgressBarClickHandler } from './ProgressBar';

import './CamelliaVisualizer.css'


const audioContext = new AudioContext();
const emptyArrayOnDisplay = [0, 0];


interface WidthHeight {
    width: number; height: number;
}


interface CamelliaVisualzerProps {
    defaultColor: FillStrokeColor;
    curveSpectrum?: Partial<FillStrokeColor>;
    barSpectrum?: Partial<Omit<FillStrokeColor, "fill">>;
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


function getContentHeight(windowSize: WidthHeight, ratio: WidthHeight) {
    let widthDivided = windowSize.width / ratio.width;
    let heightDivided = windowSize.height / ratio.height;
    return widthDivided >= heightDivided ? windowSize.height : widthDivided * ratio.height
}


const CamelliaVisualizer : React.FC<CamelliaVisualzerProps> = (props) => {


    const [ windowSize, setWindowSize ] = useState<WidthHeight>({ width: window.innerWidth, height: window.innerHeight });
    const [ contentHeight, setContentHeight ] = useState<number>(
        getContentHeight(windowSize, { width: 3, height: 2 })
    );
    const [ audioBuffer, setAudioBuffer ] = useState<AudioBuffer>();
    
    const [ processing, setProcessingState ] = useState<boolean>(false);
    const [ parsedArray, setParsedArray ] = useState<number[][]>();
    const [ arrayOnDisplay, setArrayOnDisplay ] = useState(emptyArrayOnDisplay);
    const [ volumeArray, setVolumeArray ] = useState<number[]>();
    const [ volumeOnDisplay, setVolumeOnDisplay ] = useState<number>(0);

    const [ frameNumber, setFrameNumber ] = useState<number>(0);
    const [ play, setPlay ] = useState<boolean>(false);
    
    const [ imageSrc, setImageSrc ] = useState<string>();


    const playSoundRef = useRef<AudioBufferSourceNode>();
    const inputFileRef = useRef<HTMLInputElement>(null);

    const loopStartRef = useRef<number>();
    const nextLoopAtRef = useRef<number>(0);
    
    const requestAnimationIdRef = useRef<number>();


    const setFrame = (frame: number) => {
        let playing = play;
        stop();
        playing ? start({ frame, forced: true }) : setFrameNumber(frame);
    }


    const start = (options: { frame?: number, forced?: boolean } = {}) => {
        let { frame, forced } = options;

        if(!processing && (forced ? true : !play) && audioBuffer && parsedArray) {
            const bufferSource = audioContext.createBufferSource();
            bufferSource.buffer = audioBuffer;
            bufferSource.connect(audioContext.destination);

            if(frame) {
                bufferSource.start(0, frame / props.framerate);
                setFrameNumber(frame);
            }
            else {
                bufferSource.start(0, frameNumber / props.framerate);
            }
            playSoundRef.current = bufferSource;
            setPlay(true);
        }
    }


    const stop = useCallback((resetTimer: boolean = false) => {
        if(!processing && audioBuffer && playSoundRef.current) {
            playSoundRef.current.stop()
            setPlay(false);
            loopStartRef.current = undefined;

            if(resetTimer) setFrameNumber(0);
        }
    }, [ audioBuffer, processing ]);
    

    const loop = useCallback(() => {
        let next = nextLoopAtRef.current;
        const now = new Date().getTime();
        if (!loopStartRef.current) {
            loopStartRef.current = now;
            next = now + 1000 / props.framerate;
            nextLoopAtRef.current = next;
        }
        // =================
        if(now >= next) {
            let newFrameNumber = frameNumber;
            do {
                next += 1000 / props.framerate;
                if(play) newFrameNumber++;
            } while(now >= next);

            nextLoopAtRef.current = next;
            if(parsedArray && newFrameNumber >= parsedArray.length) {
                stop(true);
            }
            else {
                setFrameNumber(newFrameNumber);
            }
        }
        requestAnimationIdRef.current = requestAnimationFrame(loop);
    }, [ props, stop, play, parsedArray, frameNumber/*, loopStart, nextLoopAt*/ ])


    const updateSpectrum = useCallback(() => {
        let array = parsedArray?.[frameNumber];
        let mag = volumeArray?.[frameNumber];
        setArrayOnDisplay(array ?? emptyArrayOnDisplay);
        setVolumeOnDisplay(mag ?? 0);
    }, [ frameNumber, parsedArray, volumeArray ])


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
            let max, magArray = new Array(parsed.length);
            for(let i = 0; i < parsed.length; ++i) {
                let spectrum = parsed[i];
                max = 0;
                for(let freqValue of spectrum) {
                    max = freqValue > max ? freqValue : max;
                }
                magArray[i] = max;
            }
            setVolumeArray(magArray);
            setProcessingState(false);
        } catch(e) {
            console.error(e);
        }
    }, [ props ]);


    const onUrlUpdate : React.ChangeEventHandler<HTMLInputElement> = (event) => {
        setImageSrc(event.target.value);
    }


    const onProgressBarClick : ProgressBarClickHandler = (value) => {
        if(audioBuffer && parsedArray) {
            setFrame(Math.floor(value));
        }
    }


    const onAlbumClick : AlbumCoverClickHandler = () => {
        play ? stop() : start();
    }


    const getRelative = (absolute1080Number: number) => {
        return absolute1080Number * contentHeight / 1080;
    }


    const handleResize = useCallback(() => {
        let widthHeight = { width: window.innerWidth, height: window.innerHeight };

        setContentHeight(getContentHeight(widthHeight, { width: 3, height: 2 }));
        
        setWindowSize(widthHeight);
    }, []);


    useEffect(() => {
        window.addEventListener('resize', handleResize);
        loop();
        return () => {
            window.removeEventListener('resize', handleResize);
            if(requestAnimationIdRef.current) cancelAnimationFrame(requestAnimationIdRef.current);
        }
    }, [ loop, handleResize ]);


    useEffect(() => {
        updateSpectrum();
    }, [ updateSpectrum ]);


    return (<>
        <div className="camellia-visualzer">
            <Background
                src={ imageSrc }
                magnify={ Math.min(1 + 0.01 * Math.sqrt(volumeOnDisplay), 10) }
            />
            <AlbumCover
                right={ windowSize.width / 2 + getRelative(86) }
                bottom={ windowSize.height / 2 - getRelative(197) }
                width={ getRelative(648) }
                height={ getRelative(648) }
                src={ imageSrc }
                onClick={ parsedArray ? onAlbumClick : undefined }
            />
            <AudioSpectrum 
                arrayOnDisplay={ arrayOnDisplay }
                curveColor={ mergeColor(props.curveSpectrum, props.defaultColor) }
                barColor={ mergeColor(props.barSpectrum, props.defaultColor) }
                ballCount={ 12 }
                ballRadius={ getRelative(4) }
                left={ windowSize.width / 2 - getRelative(44) }
                width={ getRelative(777) }
                bottom={ windowSize.height / 2 + getRelative(175) }
                zoom={ 28 }
                waveScale={ getRelative(4) }
            />
            <ProgressBar
                color={ mergeColor(props.progressBar, props.defaultColor) }
                left={ windowSize.width / 2 - getRelative(40) }
                width={ getRelative(776) }
                y={ windowSize.height / 2 + getRelative(194) }
                current={ frameNumber }
                total={ parsedArray?.length ?? 0 }
                ballRadius={ getRelative(8) }
                onClick={ onProgressBarClick }
            />
            <input
                className="undraggable"
                id="audio_input" 
                ref={ inputFileRef } 
                type="file" accept="audio/*" 
                onInput={ onFileSelection }
            />
            { processing ? "Processing..." : "" }
            <input
                id="start_button"
                type="button" 
                value="STOP"
                onClick={ () => stop(true) }
            />
            <input
                className="undraggable"
                id="image_input"
                type="text"
                onChange={ onUrlUpdate }
                placeholder="Image url..."
            /><br/>
        </div>
    </>);
}

export default CamelliaVisualizer;
  