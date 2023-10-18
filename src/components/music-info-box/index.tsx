import React, { useCallback, useRef } from 'react'
import './index.css'
import { AudioFileMetaData } from '../../lib/audio/AudioPlayer'

type Props = {
    audioMetadata?: AudioFileMetaData
    font?: string,
    centerX: number,
    centerY: number,
    width: number,
    height: number,
    fontSize: number
}

const canvas = document.createElement('canvas')

function getCssStyle(element: HTMLElement, property: string) {
    return window.getComputedStyle(element, null).getPropertyValue(property);
}

function getTextWidth(element: HTMLElement, text: string, defaultFontSize: string, defaultFont?: string) {
    const context = canvas.getContext('2d');
    if(!context) return 0;

    let font = getCssStyle(element, 'font-family') ?? defaultFont ?? 'Times New Roman';
    let fontSize = getCssStyle(element, 'font-size') ?? defaultFontSize;
    let fontWeight = getCssStyle(element, 'font-weight') ?? 'normal';
    context.font = `${fontWeight} ${fontSize} ${font}`;
    
    const metrics = context.measureText(text);
    return metrics.width;
}

const MusicInfoBox = (props: Props) => {

    const artistRef = useRef<HTMLSpanElement>(null);
    const titleRef = useRef<HTMLSpanElement>(null);
    const albumRef = useRef<HTMLSpanElement>(null);


    const calculateSpacing = useCallback((ref: React.RefObject<HTMLSpanElement>, text: string, desiredWidth: number) => {

        let element = ref.current ?? document.body;

        const textWidth = getTextWidth(element, text, props.fontSize + 'px', props.font);
        const widthLeft = Math.max(desiredWidth - textWidth, 0);

        let result = text.length > 1 ? widthLeft / (text.length) : 0;
        return Math.max(result, props.fontSize / 2)
    }, [ props.font, props.fontSize ])


    let artist = props.audioMetadata?.artist ?? '';
    let artistLetterSpacing = calculateSpacing(titleRef, artist, props.width * 0.4)

    let title = props.audioMetadata?.title ?? '';
    if(title === '') title = 'Untitled'
    let titleLetterSpacing = calculateSpacing(titleRef, title, props.width * 0.6)

    let album = props.audioMetadata?.album;
    album = album ? `From: ${album}` : '';
    let albumLetterSpacing = calculateSpacing(titleRef, album, props.width * 0.4)


    return (
        <div
            className='music-info-box'
            style={{
                left: (props.centerX - props.width / 2) + 'px',
                top: (props.centerY - props.height / 2) + 'px',
                width: props.width + 'px',
                height: props.height + 'px',
                fontFamily: props.font
            }}
        >
            <div className='artist'>
                <span ref={ artistRef } style={{
                    fontSize: props.fontSize + 'px',
                    letterSpacing: artistLetterSpacing,
                    paddingLeft: artistLetterSpacing
                }}>
                    { artist }
                </span>
            </div>
            <div className='title'>
                <span ref={ titleRef } style={{
                    fontSize: 2.5 * props.fontSize + 'px',
                    letterSpacing: titleLetterSpacing,
                    paddingLeft: titleLetterSpacing
                }}>
                    { title }
                </span>
            </div>
            <div className='album'>
                <span ref={ albumRef } style={{
                    fontSize: props.fontSize + 'px',
                    letterSpacing: albumLetterSpacing,
                    paddingLeft: albumLetterSpacing
                }}>
                    { album }
                </span>
            </div>
        </div>
    )
}

export default MusicInfoBox