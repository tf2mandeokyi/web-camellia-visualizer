import React, { useRef, useEffect } from 'react';
import { ContainsCanvas } from './ContainsCanvas'

import './AudioSpectrum.css'


function getMagnitude(y0: number, ay: number, y1: number) : number {
    if(ay > y0 && ay > y1) {
        return 1 / (1 + 4 * ((y0 + y1) / (2 * ay)));
    }
    else {
        return 1 / 3;
    }
}


function drawBezier(
    context: CanvasRenderingContext2D, 
    x0: number, dx: number, 
    y0: number, ay: number, by: number, y1: number
) : void {
    const ax = x0 + dx, bx = ax + dx;
    const amag = getMagnitude(y0, ay, by), bmag = getMagnitude(ay, by, y1);
    const ady = (by - y0) / 2, bdy = (y1 - ay) / 2;

    context.bezierCurveTo(
        ax + amag * dx, ay + amag * ady,
        bx - bmag * dx, by - bmag * bdy,
        bx, by
    );
}


interface AudioSpectrumProps extends ContainsCanvas {
    arrayOnDisplay: number[];
    fillStyle: string | CanvasGradient | CanvasPattern;
    strokeStyle: string | CanvasGradient | CanvasPattern;
    waveScale: number;
    left: number;
    bottom: number;
    width: number;
    zoom: number;
}


const AudioSpectrum : React.FC<AudioSpectrumProps> = (props) => {

    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if(!canvasRef.current) return;

        const canvas = canvasRef.current;
        canvas.style.left = props.left + 'px';
        canvas.style.bottom = (window.innerHeight - props.bottom) + 'px';
        canvas.width = props.width;
        canvas.height = props.bottom;

        const ctx = canvas.getContext('2d');
        if(!ctx) return;

        ctx.strokeStyle = props.strokeStyle;
        ctx.fillStyle = props.fillStyle;

        const { arrayOnDisplay, waveScale = 1 } = props;
        const max = arrayOnDisplay.length / props.zoom;
        ctx.beginPath();
        ctx.moveTo(0, canvas.height - arrayOnDisplay[0] * waveScale);
        for(var i = 0; i < max; ++i) {
            drawBezier(
                ctx, 
                (i-1) * canvas.width / (max - 1), canvas.width / (max - 1),
                canvas.height - (arrayOnDisplay[i-1] ?? arrayOnDisplay[i  ]) * waveScale,
                canvas.height -  arrayOnDisplay[i  ]                         * waveScale,
                canvas.height -  arrayOnDisplay[i+1]                         * waveScale,
                canvas.height - (arrayOnDisplay[i+2] ?? arrayOnDisplay[i+1]) * waveScale,
            );
        }
        ctx.lineTo(canvas.width, canvas.height);
        ctx.lineTo(0, canvas.height);
        ctx.closePath();
        ctx.fill();
    }, [ props ]);

    return (
        <canvas className="audio-spectrum" ref={canvasRef}></canvas>
    );
}

export default AudioSpectrum;