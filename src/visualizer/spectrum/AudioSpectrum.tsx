import React from 'react';
import { FillStrokeColor } from '../FillStrokeColor'
import BarSpectrum from './BarSpectrum';
import CurveSpectrum from './CurveSpectrum';

import './AudioSpectrum.css'


export interface AudioSpectrumChildProps<ColorType> {
    arrayOnDisplay: number[];
    color: ColorType;
    waveScale: number;
    left: number;
    bottom: number;
    width: number;
    zoom: number;
}


interface AudioSpectrumProps {
    arrayOnDisplay: number[];
    curveColor: FillStrokeColor;
    barColor: Omit<FillStrokeColor, "fill">;
    ballCount: number;
    ballRadius: number;
    waveScale: number;
    left: number;
    bottom: number;
    width: number;
    zoom: number;
}


const AudioSpectrum : React.FC<AudioSpectrumProps> = (props) => {

    const { curveColor, barColor, waveScale, zoom, ballCount, ballRadius, ...others } = props;

    return (<>
        <BarSpectrum 
            color={ barColor }
            zoom={ zoom }
            ballRadius={ props.ballRadius }
            ballCount={ props.ballCount }
            waveScale={ waveScale }
            { ...others }
        />
        <CurveSpectrum 
            color={ curveColor } 
            zoom={ zoom * 21 / 19 }
            waveScale={ waveScale * 3 / 5 } 
            { ...others }
        />
    </>)
}

export default AudioSpectrum;