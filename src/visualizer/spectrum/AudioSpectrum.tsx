import React from 'react';
import { FillStrokeColor } from '../FillStrokeColor'
import BarSpectrum from './BarSpectrum';
import CurveSpectrum from './CurveSpectrum';

import './AudioSpectrum.css'


export interface AudioSpectrumChildProps<ColorType> {
    arrayOnDisplay: Float32Array;
    color: ColorType;
    waveScale: number;
    left: number;
    bottom: number;
    width: number;
    range: [number, number];
}


interface AudioSpectrumProps {
    arrayOnDisplay: Float32Array;
    curveColor: FillStrokeColor;
    barColor: Omit<FillStrokeColor, "fill">;
    ballCount: number;
    ballRadius: number;
    waveScale: number;
    left: number;
    bottom: number;
    width: number;
    range: [number, number];
}


const AudioSpectrum : React.FC<AudioSpectrumProps> = (props) => {

    const { curveColor, barColor, waveScale, range, ballCount, ballRadius, ...others } = props;

    return (<>
        <BarSpectrum 
            color={ barColor }
            range={[ range[0], range[0] + (range[1] - range[0]) * 19 / 21 ]}
            ballRadius={ props.ballRadius }
            ballCount={ props.ballCount }
            waveScale={ waveScale }
            { ...others }
        />
        <CurveSpectrum 
            color={ curveColor } 
            range={ range }
            waveScale={ waveScale * 3 / 5 } 
            { ...others }
        />
    </>)
}

export default AudioSpectrum;