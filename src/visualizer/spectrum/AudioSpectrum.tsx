import React from 'react';
import { FillStrokeColor } from '../FillStrokeColor'
import BarSpectrum from './BarSpectrum';
import CurveSpectrum from './CurveSpectrum';

import './AudioSpectrum.css'


export interface AudioSpectrumChildProps {
    arrayOnDisplay: number[];
    color: FillStrokeColor;
    waveScale: number;
    left: number;
    bottom: number;
    width: number;
    zoom: number;
}


interface AudioSpectrumProps {
    arrayOnDisplay: number[];
    curveColor: FillStrokeColor;
    barColor: FillStrokeColor;
    waveScale: number;
    left: number;
    bottom: number;
    width: number;
    zoom: number;
}


const AudioSpectrum : React.FC<AudioSpectrumProps> = (props) => {

    const { curveColor, barColor, waveScale, zoom, ...others } = props;

    return (<>
        <CurveSpectrum 
            color={ curveColor } 
            zoom={ zoom * 21 / 19 }
            waveScale={ waveScale * 3 / 5 } 
            { ...others }
        />
        <BarSpectrum 
            color={ barColor }
            zoom={ zoom }
            ballRadius={ 4 }
            waveScale={ waveScale }
            { ...others }
        />
    </>)
}

export default AudioSpectrum;