import React, { useEffect, useRef } from "react";
import { AudioSpectrumChildProps } from './AudioSpectrum'


interface CurveSpectrumProps extends AudioSpectrumChildProps {
    ballRadius: number;
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
        ctx.fillStyle = props.color.fill;
        ctx.lineWidth = props.color.lineWidth;

        const { arrayOnDisplay, waveScale = 1 } = props;
        const max = Math.floor(arrayOnDisplay.length / props.zoom);
        var i, x, k, ki, kd, y;

        ctx.beginPath();
        ctx.moveTo(ballRadius, props.bottom - arrayOnDisplay[0] * waveScale);
        for(i = 1; i < 12; ++i) {
            x = i * props.width / 11;
            k = x * (max - 1) / props.width;
            ki = Math.floor(k);
            kd = k - ki;
            y = arrayOnDisplay[ki] + kd * (arrayOnDisplay[ki+1] - arrayOnDisplay[ki]);
            y = y ?? 0;
            y = Number.isNaN(y) ? 0 : y;
            ctx.lineTo(x + ballRadius, props.bottom - y * waveScale);
        }
        ctx.stroke();
        
        for(i = 0; i < 12; ++i) {
            x = i * props.width / 11;
            k = x * (max - 1) / props.width;
            ki = Math.floor(k);
            kd = k - ki;
            y = arrayOnDisplay[ki] + kd * (arrayOnDisplay[ki+1] - arrayOnDisplay[ki]);
            y = y ?? 0;
            y = Number.isNaN(y) ? 0 : y;
            ctx.beginPath();
            ctx.arc(
                x + ballRadius, props.bottom - y * waveScale, 
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