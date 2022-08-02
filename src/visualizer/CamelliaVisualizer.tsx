import { useEffect, useState, useRef, useCallback } from 'react';
import { FillStrokeColor } from './FillStrokeColor';
import { AudioPlayer } from './audio/AudioPlayer';
import ScheduledRepeater from './repeater/ScheduledRepeater';
import Background from './image/Background'
import AudioSpectrum from './spectrum/AudioSpectrum';
import AlbumCover, { AlbumCoverClickHandler } from './image/AlbumCover'
import ProgressBar, { ProgressBarClickHandler } from './ProgressBar';
import * as FourierWorker from './workers/fourierWorker';

import './CamelliaVisualizer.css'


const emptyArrayOnDisplay = new Float32Array([0, 0]);


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
    
    const [ processingText, setProcessingText ] = useState<string>("");

    const [ parsedArray, setParsedArray ] = useState<Float32Array[]>();
    const [ arrayOnDisplay, setArrayOnDisplay ] = useState<Float32Array>(emptyArrayOnDisplay);
    const processedParsedArray = useRef<Float32Array[]>();

    const [ volumeArray, setVolumeArray ] = useState<Float32Array>();
    const [ volumeOnDisplay, setVolumeOnDisplay ] = useState<number>(0);
    const processedVolumeArray = useRef<Float32Array>();

    const [ frameNumber, setFrameNumber ] = useState<number>(0);
    const [ imageSrc, setImageSrc ] = useState<string>();


    const calculationWorkerRef = useRef<FourierWorker.CustomFourierWorker>();

    const inputFileRef = useRef<HTMLInputElement>(null);
    const repeatCheckboxRef = useRef<HTMLInputElement>(null);
    const imageSrcInputRef = useRef<HTMLInputElement>(null);

    const playerRef = useRef<AudioPlayer>();
    const processRef = useRef<number>(-1);


    const start = useCallback((options: { frame?: number, forced?: boolean } = {}) => {
        let { frame, forced } = options;

        let player = playerRef.current;
        if(!player) return;
        
        if(processRef.current !== -1) return;
        if(!player.isAudioInserted() || !parsedArray) return;

        if(forced ? true : !player.isPlaying()) {
            if(frame) {
                player.start(frame / props.framerate);
                setFrameNumber(frame);
            }
            else {
                player.start(frameNumber / props.framerate);
            }
        }
    }, [ frameNumber, parsedArray, props ])


    const stop = useCallback((resetTimer: boolean = false) => {
        let player = playerRef.current;
        if(!player) return;
        
        if(processRef.current === -1 && player.isAudioInserted()) {
            player.stop();
            if(resetTimer) setFrameNumber(0);
        }
    }, []);


    const setFrame = useCallback((frame: number) => {
        let player = playerRef.current;
        if(!player) return;

        let playing = player.isPlaying();
        stop();
        playing ? start({ frame, forced: true }) : setFrameNumber(frame);
    }, [ start, stop ])


    const updateProcessString = useCallback(() => {
        if(processRef.current === -1) {
            setProcessingText("");
        } else if(processRef.current === 0) {
            setProcessingText("Reading...");
        } else if(processRef.current > 0) {
            setProcessingText(`Calculating: ${Math.trunc(processRef.current * 100) / 100}%`);
        }
    }, []);
    

    const loop = useCallback((steps: number) => {
        updateProcessString();

        let newFrameNumber = frameNumber;
        if(playerRef.current?.isPlaying()) newFrameNumber += steps;

        if(parsedArray && newFrameNumber >= parsedArray.length) {
            stop(true);
            if(repeatCheckboxRef.current?.checked) {
                start({ forced: true });
            }
        }
        else {
            setFrameNumber(newFrameNumber);
        }
    }, [ start, stop, updateProcessString, parsedArray, frameNumber ])


    const updateSpectrum = useCallback(() => {
        let array = parsedArray?.[frameNumber];
        let mag = volumeArray?.[frameNumber];
        setArrayOnDisplay(array ?? emptyArrayOnDisplay);
        setVolumeOnDisplay(mag ?? 0);
    }, [ frameNumber, parsedArray, volumeArray ])


    const onFileSelection = useCallback(async () => {
        processRef.current = 0;
        try {
            let player = playerRef.current;
            if(!player) return;

            const inputFile = inputFileRef.current?.files?.[0];
            if(!inputFile)  { processRef.current = -1; return; }

            let decoded = await player.insertAudioFile(inputFile);
            if(player.albumCoverUri) setImageSrc(player.albumCoverUri);

            let { numberOfChannels, sampleRate, length } = decoded;

            const channelsData = new Array(numberOfChannels).fill(0).map((_, i) => decoded.getChannelData(i));

            if(calculationWorkerRef.current) {
                // TODO: figure out whether to make the sample rate customizable
                calculationWorkerRef.current.postMessage({
                    type: 'input',
                    dataArrayLength: length,
                    channelsData, sampleRate,
                    framerate: props.framerate,
                    transformZoom: 4, // Change this property's name
                    customSampleRate: 2048
                })
            } else {
                processRef.current = -1;
            }
        } catch(e) {
            console.error(e);
            processRef.current = -1;
        }
    }, [ props ]);


    const onUrlUpdate : React.ChangeEventHandler<HTMLInputElement> = (event) => {
        setImageSrc(event.target.value);
    }


    const onProgressBarClick : ProgressBarClickHandler = (value) => {
        if(playerRef.current?.isAudioInserted() && parsedArray) {
            setFrame(Math.floor(value));
        }
    }


    const triggerStartStop : AlbumCoverClickHandler = useCallback(() => {
        if(!playerRef.current) return;
        playerRef.current.isPlaying() ? stop() : start();
    }, [ start, stop ]);


    const getRelative = (absolute1080Number: number) => {
        return absolute1080Number * contentHeight / 1080;
    }


    const handleResize = useCallback(() => {
        let widthHeight = { width: window.innerWidth, height: window.innerHeight };

        setContentHeight(getContentHeight(widthHeight, { width: 3, height: 2 }));
        
        setWindowSize(widthHeight);
    }, []);


    const handleKeyPress = useCallback((event: KeyboardEvent) => {
        if(event.key === ' ') {
            triggerStartStop();
        }
    }, [ triggerStartStop ]);


    const handleCalculationWorkerMessage : FourierWorker.MessageHandlerFromOutside = useCallback(({ data }) => {
        if(!calculationWorkerRef.current) return;

        switch(data.type) {
            case 'start':
                let { arraySize } = data;
                processedParsedArray.current = new Array(arraySize).fill(emptyArrayOnDisplay);
                processedVolumeArray.current = new Float32Array(arraySize);
                break;

            case 'part':
                if(processedParsedArray.current && processedVolumeArray.current) {
                    let { index, fourierTransform, volume } = data;
                    processedParsedArray.current[index] = fourierTransform;
                    processedVolumeArray.current[index] = volume;
                    processRef.current = 100 * index / processedParsedArray.current.length;
                }
                break;

            case 'done':
                if(processedParsedArray.current && processedVolumeArray.current) {
                    processRef.current = -1;
                    setParsedArray(processedParsedArray.current);
                    setVolumeArray(processedVolumeArray.current);
                    processedParsedArray.current = undefined;
                    processedVolumeArray.current = undefined;

                    stop(true);
                    resetWorker();
                }
                break;
        }
    }, [ stop ]);


    const setupWorker = useCallback((forced: boolean = false) => {
        if(forced || !calculationWorkerRef.current) {
            let worker = new Worker(new URL('./workers/fourierWorker.js', import.meta.url));
            worker.onmessage = handleCalculationWorkerMessage;
            calculationWorkerRef.current = worker;
        }
    }, [ handleCalculationWorkerMessage ]);


    const resetWorker = useCallback(() => {
        if(!calculationWorkerRef.current) return;
        
        let oldWorker = calculationWorkerRef.current;
        setupWorker(true);
        oldWorker.terminate();
    }, [ setupWorker ]);


    useEffect(() => {
        window.addEventListener('resize', handleResize);
        window.addEventListener('keypress', handleKeyPress);

        if(!playerRef.current) {
            playerRef.current = new AudioPlayer();
        }
        setupWorker();

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('keypress', handleKeyPress);
        }
    }, [ handleCalculationWorkerMessage, handleKeyPress, setupWorker, loop, handleResize ]);


    useEffect(() => {
        updateSpectrum();
    }, [ updateSpectrum ]);


    return (<>
        <div className="camellia-visualzer">
            <ScheduledRepeater
                callback={ loop }
                framerate={ props.framerate }
            />
            <Background
                src={ imageSrc }
                magnify={ Math.min(1 + 0.04 * volumeOnDisplay * volumeOnDisplay, 10) + 0.05 }
            />
            <AlbumCover
                right={ windowSize.width / 2 + getRelative(86) }
                bottom={ windowSize.height / 2 - getRelative(197) }
                width={ getRelative(648) }
                height={ getRelative(648) }
                src={ imageSrc }
                onClick={ parsedArray ? triggerStartStop : undefined }
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
                range={[ 0.0016 / 2, 0.017 / 2 ]}
                waveScale={ getRelative(2) }
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
            { processingText }
            <input
                id="repeat_checkbox"
                type="checkbox"
                ref={ repeatCheckboxRef }
            />
            <input
                id="start_button"
                type="button" 
                value="STOP"
                onClick={ () => stop(true) }
            />
            <input
                className="undraggable"
                ref={ imageSrcInputRef }
                id="image_input"
                type="text"
                onChange={ onUrlUpdate }
                placeholder="Image url..."
            /><br/>
        </div>
    </>);
}

export default CamelliaVisualizer;
  