import React, { useEffect, useRef } from "react";
import { AudioSpectrumChildProps } from './AudioSpectrum';
import { FillStrokeColor } from "../FillStrokeColor";


interface CurveSpectrumProps extends AudioSpectrumChildProps<Omit<FillStrokeColor, "fill">> {
    ballRadius: number;
    ballCount: number;
}


function interpolate(y0: number, y1: number, t: number) {
    return y0 + t * (y1 - y0);
}


const BarSpectrum : React.FC<CurveSpectrumProps> = (props) => {

    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if(!canvasRef.current) return;
        const { ballRadius } = props;

        const canvas = canvasRef.current;

        canvas.style.left = (props.left - ballRadius) + 'px';
        canvas.style.bottom = (window.innerHeight - props.bottom - 2 * ballRadius) + 'px';
        canvas.width = props.width + 2 * ballRadius;
        canvas.height = props.bottom + 2 * ballRadius;

        const ctx = canvas.getContext('2d');
        if(!ctx) return;

        ctx.strokeStyle = props.color.stroke;
        ctx.fillStyle = props.color.stroke;
        ctx.lineWidth = props.color.lineWidth;

        const { arrayOnDisplay, waveScale = 1, range } = props;
        const ballArray = new Array(props.ballCount);
        let i, n = arrayOnDisplay.length, r = range[1] - range[0];

        for(i = 0; i < props.ballCount; ++i) {
            let x = i * props.width / (props.ballCount - 1);
            let k = (n - 1) * (x * r / canvas.width + range[0]);

            let k_int = Math.floor(k);
            let k_dec = k - k_int;
            let y = interpolate(arrayOnDisplay[k_int], arrayOnDisplay[k_int+1], k_dec);
            y = y ?? 0;
            y = Number.isNaN(y) ? 0 : y;
            ballArray[i] = y;
        }

        ctx.beginPath();
        ctx.moveTo(ballRadius, props.bottom - ballArray[0] * waveScale);
        for(i = 1; i < props.ballCount; ++i) {
            ctx.lineTo(i * props.width / (props.ballCount - 1) + ballRadius, props.bottom - ballArray[i] * waveScale);
        }
        ctx.stroke();
        
        for(i = 0; i < props.ballCount; ++i) {
            ctx.beginPath();
            ctx.arc(
                i * props.width / (props.ballCount - 1) + ballRadius, props.bottom - ballArray[i] * waveScale, 
                props.ballRadius, 0, 2 * Math.PI
            );
            ctx.closePath();
            ctx.fill();
        }
    }, [ props ]);

    return (
        <canvas className="bar-spectrum" ref={canvasRef}></canvas>
    );
}

export default BarSpectrum;