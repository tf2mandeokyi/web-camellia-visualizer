import { useEffect, useState, useRef, useCallback } from 'react';

import { FillStrokeColor, mergeColor } from '../../lib/color/FillStrokeColor';
import { AudioFileMetaData, AudioPlayer } from '../../lib/audio/AudioPlayer';
import { FourierCalculator } from '../../lib/fft-calc';

import AlbumCover, { AlbumCoverClickHandler } from '../album-cover'
import ProgressBar, { ProgressBarClickHandler } from '../progress-bar';
import Background from '../background'
import AudioSpectrum from '../spectrum';

import './index.css'
import MusicInfoBox from '../music-info-box';


const emptySpectrumArrayOnDisplay = new Float32Array([0, 0]);
const emptyWaveArrayOnDisplay = new Float32Array([2, 2]);


interface WidthHeight {
    width: number; height: number;
}
const WINDOW_RATIO: WidthHeight = { width: 16, height: 9 } // Set your screen ratio here

function getContentHeight(windowSize: WidthHeight, ratio: WidthHeight = WINDOW_RATIO) {
    let widthDivided = windowSize.width / ratio.width;
    let heightDivided = windowSize.height / ratio.height;
    return widthDivided >= heightDivided ? windowSize.height : widthDivided * ratio.height
}

interface Props {
    defaultColor: FillStrokeColor;
    curveSpectrum?: Partial<FillStrokeColor>;
    barSpectrum?: Partial<Omit<FillStrokeColor, "fill">>;
    progressBar?: Partial<FillStrokeColor>;
    framerate: number;
}

const CamelliaVisualizer : React.FC<Props> = (props) => {

    const [ windowSize, setWindowSize ] = useState<WidthHeight>({ width: window.innerWidth, height: window.innerHeight });
    const [ contentHeight, setContentHeight ] = useState<number>(
        getContentHeight(windowSize, WINDOW_RATIO)
    );
    
    const [ waveArrayOnDisplay, setWaveArrayOnDisplay ] = useState<Float32Array>(emptyWaveArrayOnDisplay);
    const [ spectrumArrayOnDisplay, setSpectrumArrayOnDisplay ] = useState<Float32Array>(emptySpectrumArrayOnDisplay);
    const [ volumeOnDisplay, setVolumeOnDisplay ] = useState<number>(0);
    const [ fps, setFps ] = useState<number>(0);

    const [ processingText, setProcessingText ] = useState<string>("");
    const [ showInputs, setShowInputs ] = useState<boolean>(true);
    const [ font, setFont ] = useState<string>();
    const [ audioMetadata, _setAudioMetadata ] = useState<AudioFileMetaData>({});


    const currentPlayTimeRef = useRef<number>(-1);
    const playerRef = useRef<AudioPlayer>();
    const calculatorRef = useRef<FourierCalculator>();
    const readingStateRef = useRef<boolean>(false);
    const timeoutRef = useRef<NodeJS.Timeout>();

    const inputFileRef = useRef<HTMLInputElement>(null);
    const fontInputRef = useRef<HTMLInputElement>(null);
    const artistNameInputRef = useRef<HTMLInputElement>(null);
    const musicTitleInputRef = useRef<HTMLInputElement>(null);
    const albumNameInputRef = useRef<HTMLInputElement>(null);
    const repeatCheckboxRef = useRef<HTMLInputElement>(null);
    const imageSrcInputRef = useRef<HTMLInputElement>(null);
    const volumeSliderRef = useRef<HTMLInputElement>(null);


    const start = useCallback((options: { seconds?: number, forced?: boolean } = {}) => {
        let { seconds, forced } = options;

        if(!calculatorRef.current?.isAudioBufferSet()) return;

        let player = playerRef.current;
        if(!player?.isAudioInserted()) return;
        
        if(forced ? true : !player.isPlaying()) {
            player.start(seconds);
        }
    }, []);


    const stop = useCallback((resetTime?: boolean) => {
        if(playerRef.current?.isAudioInserted())
            playerRef.current.stop(resetTime);
    }, []);


    const updateProcessString = useCallback(() => {
        if(readingStateRef.current) {
            setProcessingText(`Reading...`);
        } else {
            setProcessingText("");
        }
    }, []);


    const updateSpectrum = useCallback(() => {
        if(!calculatorRef.current?.isAudioBufferSet()) return;

        // Update current frame based on the current time
        let timeMs = (playerRef.current?.getTime() ?? 0) * 1000;
        
        // Skip if the frame is the
        if(timeMs === currentPlayTimeRef.current) return;
        currentPlayTimeRef.current = timeMs;

        let rawData = calculatorRef.current.getRawData(timeMs);
        let frameData = calculatorRef.current.calculateData(rawData);
        if(!frameData) return;

        let { transformArray, volume } = frameData;
        setWaveArrayOnDisplay(rawData[0].map(i => i+2));
        setSpectrumArrayOnDisplay(transformArray);
        setVolumeOnDisplay(volume);
    }, []);
    

    const lastFrameMsRef = useRef<number>(0);
    const fpsFrameCountRef = useRef<number>(0);
    const loop = useCallback(() => {
        updateProcessString();
        updateSpectrum();

        const nowMs = window.performance.now();
        if(Math.floor(nowMs / 1000) - Math.floor(lastFrameMsRef.current / 1000)) {
            setFps(fpsFrameCountRef.current);
            fpsFrameCountRef.current = 0;
        }
        fpsFrameCountRef.current++;
        lastFrameMsRef.current = nowMs;

        timeoutRef.current = setTimeout(loop, 0);
    }, [ updateProcessString, updateSpectrum ])


    const setAudioMetadata = useCallback((metadata: AudioFileMetaData) => {
        _setAudioMetadata(metadata)
        localStorage.setItem('camellia-visualizer.audio-metadata', JSON.stringify(metadata)) 

        if(imageSrcInputRef.current) {
            imageSrcInputRef.current.value = metadata.imageUri ?? ''
        }
        if(artistNameInputRef.current) {
            artistNameInputRef.current.value = metadata.artist ?? '';
        }
        if(musicTitleInputRef.current) {
            musicTitleInputRef.current.value = metadata.title ?? '';
        }
        if(albumNameInputRef.current) {
            albumNameInputRef.current.value = metadata.album ?? '';
        }
    }, [])


    const onFileSelection = useCallback(async () => {
        readingStateRef.current = true;
        try {
            let player = playerRef.current;
            if(!player) return;

            let calculator = calculatorRef.current;
            if(!calculator) return;

            const inputFile = inputFileRef.current?.files?.[0];
            if(!inputFile) return;

            let decoded = await player.insertAudioFile(inputFile);
            if(player.audioMetadata) {
                let oldMetadataStr = localStorage.getItem('camellia-visualizer.audio-metadata') ?? '{}';
                let oldMetadata = JSON.parse(oldMetadataStr) as AudioFileMetaData;

                let audioMetadata = { oldMetadata, ...player.audioMetadata };
                setAudioMetadata(audioMetadata);
            }
            calculator.setAudioBuffer(decoded);
            
            currentPlayTimeRef.current = 0;
            setWaveArrayOnDisplay(emptyWaveArrayOnDisplay);
            setSpectrumArrayOnDisplay(emptySpectrumArrayOnDisplay);
            setVolumeOnDisplay(0);
        } catch(e) {
            console.error(e);
        } finally {
            readingStateRef.current = false;
        }
    }, [ setAudioMetadata ]);


    const onCoverUrlUpdate : React.ChangeEventHandler<HTMLInputElement> = (event) => {
        let newAudioMetadata = audioMetadata;
        newAudioMetadata.imageUri = event.target.value;
        setAudioMetadata(newAudioMetadata);
        localStorage.setItem('camellia-visualizer.audio-metadata', JSON.stringify(newAudioMetadata)) 
    }


    const onVolumeSliderChange : React.ChangeEventHandler<HTMLInputElement> = (event) => {
        let str = event.target.value;
        let value = parseFloat(str);

        playerRef.current?.setVolume(Math.pow(2, value) - 1);
        localStorage.setItem('volume', str);
    } 


    const onProgressBarUpdate : ProgressBarClickHandler = (value) => {
        if(playerRef.current?.isAudioInserted()) {
            playerRef.current.setTime(value, true);
        }
    }


    const toggleStartStop : AlbumCoverClickHandler = useCallback(() => {
        if(!playerRef.current) return;
        playerRef.current.isPlaying() ? stop() : start();
    }, [ start, stop ]);


    const getRelative = (absolute1080Number: number) => {
        return absolute1080Number * contentHeight / 1080;
    }


    const handleResize = useCallback(() => {
        let widthHeight = { width: window.innerWidth, height: window.innerHeight };

        setContentHeight(getContentHeight(widthHeight, WINDOW_RATIO));
        
        setWindowSize(widthHeight);
    }, []);


    const handleKeyPress = useCallback((event: KeyboardEvent) => {
        if(event.key === ' ') {
            toggleStartStop();
        }
        else if(event.key === 'h') {
            setShowInputs(s => !s);
        }
    }, [ toggleStartStop ]);


    const setupCalculator = useCallback((forced: boolean = false) => {
        if(forced || !calculatorRef.current) {
            calculatorRef.current = new FourierCalculator({
                sampleRatePerSecond: 2048,
                transformZoom: 4
            });
        }
    }, []);


    const setupAudioPlayer = useCallback(() => {
        if(playerRef.current) return;
        
        playerRef.current = new AudioPlayer().setDonePlayingHandler(() => {
            if(repeatCheckboxRef.current?.checked) {
                start({ seconds: 0, forced: true });
            }
        });
    }, [ start ]);


    const manageInputs = useCallback(() => {
        if(fontInputRef.current) {
            let font = localStorage.getItem('camellia-visualizer.font') ?? '';
            fontInputRef.current.value = font
            setFont(font)
        }

        let metadataStr = localStorage.getItem('camellia-visualizer.audio-metadata') ?? '{}';
        let metadata = JSON.parse(metadataStr) as AudioFileMetaData;
        setAudioMetadata(metadata)
    }, [ setAudioMetadata ]);


    const getPreviousVolume = useCallback(() => {
        if(volumeSliderRef.current) {
            let prev = localStorage.getItem('volume');
            if(prev) {
                let value = parseFloat(prev);

                if(isNaN(value)) value = 1;
                if(value > 1) value = 1;
                if(value < 0) value = 0;
                
                playerRef.current?.setVolume(value);
                prev = value + '';
            }

            volumeSliderRef.current.value = prev ?? '1';
        }
    }, []);


    useEffect(() => {
        window.addEventListener('resize', handleResize);
        window.addEventListener('keypress', handleKeyPress);

        manageInputs();
        setupCalculator();
        setupAudioPlayer();
        getPreviousVolume();
        loop();

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('keypress', handleKeyPress);

            if(timeoutRef.current) clearTimeout(timeoutRef.current);
        }
    }, [ manageInputs, handleKeyPress, setupCalculator, setupAudioPlayer, loop, handleResize, getPreviousVolume ]);


    useEffect(() => {
        updateSpectrum();
    }, [ updateSpectrum ]);


    const settingsBox = (
        <div className={ `inputs${ showInputs ? '' : ' hidden' }` } >
            <span>Click 'H' to hide me!</span>
            <table>
                <tbody>
                    <tr>
                        <td>Audio file</td>
                        <td><input className='undraggable' type="file" accept="audio/*,video/*"
                            ref={ inputFileRef } onInput={ onFileSelection }/>
                        </td>
                        <td>{ processingText }</td>
                    </tr>
                    <tr>
                        <td>Volume</td>
                        <td><input type="range"
                            ref={ volumeSliderRef } onChange={ onVolumeSliderChange }
                            min={ 0 } max={ 1 } step={ 0.001 }/>
                        </td>
                    </tr>
                    <tr>
                        <td>Repeat?</td>
                        <td><input id="repeat_checkbox" type="checkbox"
                            ref={ repeatCheckboxRef }/>
                        </td>
                    </tr>
                    <tr><td>&nbsp;</td></tr>
                    <tr>
                        <td>Image URL</td>
                        <td><input className='undraggable' type="text" placeholder="Image url..."
                            ref={ imageSrcInputRef } onChange={ onCoverUrlUpdate }/>
                        </td>
                    </tr>
                    <tr>
                        <td>Font</td>
                        <td><input className='undraggable' type='text' placeholder="monospace"
                            ref={ fontInputRef } onChange={ event => {
                                setFont(event.target.value);
                                localStorage.setItem('camellia-visualizer.font', event.target.value)
                            }}/>
                        </td>
                    </tr>
                    <tr>
                        <td>Artist Name</td>
                        <td><input className='undraggable' type='text'
                            ref={ artistNameInputRef } onChange={ event => {
                                setAudioMetadata({ ...audioMetadata, artist: event.target.value });
                                localStorage.setItem('camellia-visualizer.artist-name', event.target.value)
                            }}/>
                        </td>
                    </tr>
                    <tr>
                        <td>Music Title</td>
                        <td><input className='undraggable' type='text'
                            ref={ musicTitleInputRef } onChange={ event => {
                                setAudioMetadata({ ...audioMetadata, title: event.target.value });
                                localStorage.setItem('camellia-visualizer.music-name', event.target.value)
                            }}/>
                        </td>
                    </tr>
                    <tr>
                        <td>Album Name</td>
                        <td><input className='undraggable' type='text'
                            ref={ albumNameInputRef } onChange={ event => {
                                setAudioMetadata({ ...audioMetadata, album: event.target.value });
                                localStorage.setItem('camellia-visualizer.album-name', event.target.value)
                            }}/>
                        </td>
                    </tr>
                </tbody>
            </table>
            
            <div>
                <input
                    type="button" 
                    value="START/PAUSE"
                    onClick={ () => toggleStartStop() }
                />
                <input
                    type="button" 
                    value="STOP"
                    onClick={ () => stop(true) }
                />
                <span style={{ marginLeft: '5px' }}>
                    { fps } FPS
                </span>
            </div>
        </div>
    )

    return (<>
        <div className="camellia-visualzer">
            <Background
                src={ audioMetadata?.imageUri }
                magnify={ Math.min(1 + 0.0005 * volumeOnDisplay, 10) + 0.05 }
            />
            <MusicInfoBox
                centerX={ windowSize.width / 2 + getRelative(330) }
                centerY={ windowSize.height / 2 + getRelative(280) }
                width={ getRelative(1000) }
                height={ getRelative(200) }
                audioMetadata={ audioMetadata }
                font={ font }
                fontSize={ getRelative(28) }
            />
            <AlbumCover
                centerX={ windowSize.width / 2 - getRelative(524) }
                centerY={ windowSize.height / 2 - getRelative(30) }
                width={ getRelative(540) }
                height={ getRelative(540) }
                src={ audioMetadata?.imageUri }
                onClick={ calculatorRef.current?.isAudioBufferSet() ? toggleStartStop : undefined }
            />
            <AudioSpectrum 
                arrayOnDisplay={ spectrumArrayOnDisplay }
                curveColor={ mergeColor(props.curveSpectrum, props.defaultColor) }
                barColor={ mergeColor(props.barSpectrum, props.defaultColor) }
                ballCount={ 15 }
                ballRadius={ getRelative(4) }
                centerX={ windowSize.width / 2 + getRelative(330) }
                width={ getRelative(1000) }
                bottom={ windowSize.height - getRelative(390) }
                range={[ 0.0004 / 2, 0.017 / 2 ]}
                waveScale={ getRelative(2.8) }
            />
            <AudioSpectrum 
                arrayOnDisplay={ waveArrayOnDisplay }
                curveColor={ {
                    fill: 'transparent',
                    lineWidth: 0,
                    stroke: 'transparent'
                } }
                barColor={ {
                    lineWidth: 2,
                    stroke: 'white'
                } }
                ballCount={ waveArrayOnDisplay.length }
                ballRadius={ getRelative(0) }
                centerX={ windowSize.width / 2 - getRelative(524) }
                width={ getRelative(540) }
                bottom={ windowSize.height / 2 + getRelative(320) }
                range={[ 0, 20 / 19 ]}
                waveScale={ getRelative(20) }
            />
            <ProgressBar
                color={ mergeColor(props.progressBar, props.defaultColor) }
                centerX={ windowSize.width / 2 + getRelative(330) }
                width={ getRelative(1000) }
                y={ windowSize.height - getRelative(139) }
                current={ playerRef.current?.isAudioInserted() ? (playerRef.current?.getTime() ?? 0) : 0 }
                total={ playerRef.current?.isAudioInserted() ? (playerRef.current?.getDuration() ?? 1) : 1 }
                ballRadius={ getRelative(8) }
                onMouseUpdate={ onProgressBarUpdate }
            />
            { settingsBox }
        </div>
    </>);
}

export default CamelliaVisualizer;