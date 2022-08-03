import { useEffect, useState, useRef, useCallback } from 'react';
import { FillStrokeColor } from './FillStrokeColor';
import { AudioPlayer } from './audio/AudioPlayer';
import ScheduledRepeater from './repeater/ScheduledRepeater';
import Background from './image/Background'
import AudioSpectrum from './spectrum/AudioSpectrum';
import AlbumCover, { AlbumCoverClickHandler } from './image/AlbumCover'
import ProgressBar, { ProgressBarClickHandler } from './ProgressBar';

import './CamelliaVisualizer.css'
import { FourierWorkerManager } from './workers/FourierWorkerManager';


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
    const [ arrayOnDisplay, setArrayOnDisplay ] = useState<Float32Array>(emptyArrayOnDisplay);
    const [ volumeOnDisplay, setVolumeOnDisplay ] = useState<number>(0);
    const [ imageSrc, setImageSrc ] = useState<string>();


    const playerRef = useRef<AudioPlayer>();
    const workerHandlerRef = useRef<FourierWorkerManager>();

    const inputFileRef = useRef<HTMLInputElement>(null);
    const repeatCheckboxRef = useRef<HTMLInputElement>(null);
    const imageSrcInputRef = useRef<HTMLInputElement>(null);


    const start = useCallback((options: { seconds?: number, forced?: boolean } = {}) => {
        let { seconds, forced } = options;

        if(!workerHandlerRef.current?.isReady()) return;

        let player = playerRef.current;
        if(!player?.isAudioInserted()) return;
        
        if(forced ? true : !player.isPlaying()) {
            player.start(seconds);
        }
    }, []);


    const stop = useCallback((resetTime?: boolean) => {
        if(workerHandlerRef.current?.isReady() && playerRef.current?.isAudioInserted())
            playerRef.current.stop(resetTime);
    }, []);


    const updateProcessString = useCallback(() => {
        if(workerHandlerRef.current?.isReady()) {
            setProcessingText("");
        } else {
            setProcessingText(`Reading...`);
        }
    }, []);


    const updateSpectrum = useCallback(async () => {
        if(!workerHandlerRef.current?.isReady()) return;

        if(workerHandlerRef.current.isAudioInserted()) {
            let frame = Math.floor((playerRef.current?.getTime() ?? 0) * props.framerate);
            let frameData = await workerHandlerRef.current.getFrameData(frame);
            if(frameData) {
                let { transformArray, volume } = frameData;
                setArrayOnDisplay(transformArray);
                setVolumeOnDisplay(volume);
                return;
            }
        }
        setArrayOnDisplay(emptyArrayOnDisplay);
        setVolumeOnDisplay(0);
    }, [ props ]);
    

    const loop = useCallback(() => {
        updateProcessString();
        updateSpectrum();
    }, [ updateProcessString, updateSpectrum ])


    const onFileSelection = useCallback(async () => {
        try {
            let player = playerRef.current;
            if(!player) return;

            let workerHandler = workerHandlerRef.current;
            if(!workerHandler) return;

            const inputFile = inputFileRef.current?.files?.[0];
            if(!inputFile) return;

            let decoded = await player.insertAudioFile(inputFile);
            if(player.albumCoverUri) {
                setImageSrc(player.albumCoverUri);
            }
            workerHandler.setAudioBuffer(decoded);
        } catch(e) {
            let imageInput = imageSrcInputRef.current;
            if(imageInput) imageInput.value = `${e}`;
            console.error(e);
        }
    }, []);


    const onUrlUpdate : React.ChangeEventHandler<HTMLInputElement> = (event) => {
        setImageSrc(event.target.value);
    }


    const onProgressBarUpdate : ProgressBarClickHandler = (value) => {
        if(playerRef.current?.isAudioInserted() && workerHandlerRef.current?.isReady()) {
            playerRef.current.setTime(value, true);
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


    const setupWorkerHandler = useCallback((forced: boolean = false) => {
        if(forced || !workerHandlerRef.current) {
            workerHandlerRef.current = new FourierWorkerManager(5, props.framerate, 4);
        }
    }, [ props ]);


    useEffect(() => {
        window.addEventListener('resize', handleResize);
        window.addEventListener('keypress', handleKeyPress);

        if(!playerRef.current) {
            playerRef.current = new AudioPlayer().setDonePlayingHandler(() => {
                if(repeatCheckboxRef.current?.checked) {
                    start({ seconds: 0, forced: true });
                }
            });
        }
        setupWorkerHandler();

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('keypress', handleKeyPress);
        }
    }, [ handleKeyPress, setupWorkerHandler, start, loop, handleResize ]);


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
                onClick={ workerHandlerRef.current?.isReady() ? triggerStartStop : undefined }
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
                waveScale={ getRelative(2.5) }
            />
            <ProgressBar
                color={ mergeColor(props.progressBar, props.defaultColor) }
                left={ windowSize.width / 2 - getRelative(40) }
                width={ getRelative(776) }
                y={ windowSize.height / 2 + getRelative(194) }
                current={ playerRef.current?.isAudioInserted() ? (playerRef.current?.getTime() ?? 0) : 0 }
                total={ playerRef.current?.isAudioInserted() ? (playerRef.current?.getDuration() ?? 1) : 1 }
                ballRadius={ getRelative(8) }
                onMouseUpdate={ onProgressBarUpdate }
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