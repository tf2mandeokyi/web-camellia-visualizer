import React, { useEffect, useRef } from "react";
import { AudioSpectrumChildProps } from './AudioSpectrum'
import { interpolate } from '../../util/audioUtils';
import { FillStrokeColor } from "../FillStrokeColor";


interface CurveSpectrumProps extends AudioSpectrumChildProps<Omit<FillStrokeColor, "fill">> {
    ballRadius: number;
    ballCount: number;
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

        const { arrayOnDisplay, waveScale = 1 } = props;
        const max = Math.floor(arrayOnDisplay.length / props.zoom);
        const ballArray = new Array(props.ballCount);
        let i;
        for(i = 0; i < props.ballCount; ++i) {
            let x = i * props.width / (props.ballCount - 1);
            let k = x * (max - 1) / props.width;
            let ki = Math.floor(k);
            let kd = k - ki;
            let y = interpolate(arrayOnDisplay[ki], arrayOnDisplay[ki+1], kd);
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