import React from 'react';
import { FillStrokeColor } from '../../lib/color/FillStrokeColor'
import BarGraph from './BarGraph';
import CurvedGraph from './CurvedGraph';

import './index.css'


export interface AudioSpectrumChildProps<ColorType> {
    arrayOnDisplay: Float32Array;
    color: ColorType;
    graphScale: number;
    centerX: number;
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
    centerX: number;
    bottom: number;
    width: number;
    range: [number, number];
}


const AudioSpectrum : React.FC<AudioSpectrumProps> = (props) => {

    const { curveColor, barColor, waveScale, range, ballCount, ballRadius, ...others } = props;

    return (<div>
        <BarGraph
            color={ barColor }
            range={[ range[0], range[0] + (range[1] - range[0]) * 19 / 21 ]}
            ballRadius={ ballRadius }
            ballCount={ ballCount }
            graphScale={ waveScale }
            { ...others }
        />
        <CurvedGraph
            color={ curveColor } 
            range={ range }
            mode="continuous"
            graphScale={ waveScale * 3 / 5 } 
            { ...others }
        />
    </div>)
}

export default AudioSpectrum;