import React from 'react'
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

const splitLetters = function(str?: string) : JSX.Element[] {
    if(!str) return [];
    let result = [] as JSX.Element[];
    for(let i = 0; i < str.length; i++) {
        let char = str.charAt(i).replace(/\u00A0-\u9999<>&/gim, function(i) {
            return `&#${ i.charCodeAt(0) };`
        })
        result.push(<div>{ char }</div>)
    }
    return result;
}

const MusicInfoBox = (props: Props) => {
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
                <span style={{
                    minWidth: '40%',
                    fontSize: props.fontSize + 'px'
                }}>
                    { splitLetters(props.audioMetadata?.artist ?? '') }
                </span>
            </div>
            <div className='title'>
                <span style={{
                    minWidth: '60%',
                    fontSize: 2.5 * props.fontSize + 'px'
                }}>
                    { splitLetters(props.audioMetadata?.title ?? 'Untitled') }
                </span>
            </div>
            <div className='album'>
                <span style={{
                    minWidth: '40%',
                    fontSize: props.fontSize + 'px'
                }}>
                    { props.audioMetadata?.album ? <>
                        { splitLetters(`From: ${props.audioMetadata?.album}`) }
                    </> : <></> }
                </span>
            </div>
        </div>
    )
}

export default MusicInfoBox