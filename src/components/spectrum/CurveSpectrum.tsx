import React, { useEffect, useRef } from 'react';
import { FillStrokeColor } from '../../lib/color/FillStrokeColor';
import { AudioSpectrumChildProps } from './';


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


function drawBellCurve(
    context: CanvasRenderingContext2D,
    canvasHeight: number,
    x: number, width: number, height: number
) : void {
    context.beginPath();
    context.moveTo(x - width / 2, canvasHeight);
    // Left side
    context.bezierCurveTo(
        x - width / 4, canvasHeight - height / 2,
        x - width / 6, canvasHeight - height,
        x, canvasHeight - height
    );
    // Right side
    context.bezierCurveTo(
        x + width / 6, canvasHeight - height,
        x + width / 4, canvasHeight - height / 2,
        x + width / 2, canvasHeight
    );
    context.lineTo(x - width / 2, canvasHeight);
    context.closePath();
    context.stroke();
    context.fill();
}


interface CurveSpectrumProps extends AudioSpectrumChildProps<FillStrokeColor> {
    mode: 'continuous' | 'bells';
}


const CurveSpectrum : React.FC<CurveSpectrumProps> = (props) => {

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

        ctx.fillStyle = 'white';

        const { arrayOnDisplay, waveScale = 1, range } = props;
        const n = arrayOnDisplay.length, r = range[1] - range[0];
        const wr = canvas.width / r, dx = wr / (n - 1);

        const start = Math.floor((n - 1) * range[0]) - 1;
        const end = Math.floor((n - 1) * (r + range[0])) + 1;

        if(props.mode === 'continuous') {

            ctx.beginPath();
            ctx.moveTo(0, canvas.height - arrayOnDisplay[0] * waveScale);
            for(let i = start; i <= end; ++i) {
                drawBezier(
                    ctx,
                    (i-1) * dx - range[0] * wr, dx,
                    canvas.height - (arrayOnDisplay[i-1] ?? arrayOnDisplay[i  ]) * waveScale,
                    canvas.height -  arrayOnDisplay[i  ]                         * waveScale,
                    canvas.height -  arrayOnDisplay[i+1]                         * waveScale,
                    canvas.height - (arrayOnDisplay[i+2] ?? arrayOnDisplay[i+1]) * waveScale,
                );
            }
            ctx.lineTo(canvas.width, canvas.height);
            ctx.lineTo(0, canvas.height);
            ctx.closePath();
            ctx.stroke();
            ctx.fill();
        }
        else if(props.mode === 'bells') {
            for(let i = start; i <= end; ++i) {
                drawBellCurve(
                    ctx, canvas.height,
                    i * dx - range[0] * wr, 
                    canvas.width / 5,
                    arrayOnDisplay[i] * waveScale
                );
            }
        }
        
        ctx.globalCompositeOperation = 'source-in';
        
        ctx.strokeStyle = props.color.stroke;
        ctx.lineWidth = props.color.lineWidth;
        ctx.fillStyle = props.color.fill;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }, [ props ]);

    return (
        <canvas className="curve-spectrum" ref={canvasRef}></canvas>
    );
}

export default CurveSpectrum;