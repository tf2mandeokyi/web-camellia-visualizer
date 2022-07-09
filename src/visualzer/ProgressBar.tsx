import React, { useEffect, useRef } from 'react'
import { ContainsCanvas } from './ContainsCanvas'

import "./ProgressBar.css"


interface ProgressBarProps extends ContainsCanvas {
    left: number;
    y: number;
    width: number;
    current: number;
    total: number;
}


const ballRadius = 8;


const ProgressBar : React.FC<ProgressBarProps> = (props) => {

    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if(!canvasRef.current) return;

        const canvas = canvasRef.current;
        canvas.style.left = (props.left - ballRadius) + 'px';
        canvas.style.top = (props.y - ballRadius) + 'px';
        canvas.width = props.width + 2 * ballRadius;
        canvas.height = ballRadius * 2;

        const ctx = canvas.getContext('2d');
        if(!ctx) return;

        ctx.strokeStyle = props.strokeStyle;
        ctx.fillStyle = props.fillStyle;

        ctx.beginPath();
        ctx.moveTo(ballRadius, ballRadius-1);
        ctx.lineTo(canvas.width - ballRadius, ballRadius-1);
        ctx.lineTo(canvas.width - ballRadius, ballRadius+1);
        ctx.lineTo(ballRadius, ballRadius+1);
        ctx.closePath();
        ctx.fill();

        var x = props.width * props.current / props.total;
        ctx.beginPath();
        ctx.arc(
            ballRadius + (Number.isNaN(x) ? 0 : x), ballRadius, 
            ballRadius, 0, 2 * Math.PI
        );
        ctx.closePath();
        ctx.fill();

    }, [ props ]);

    return <canvas className="progress-bar" ref={canvasRef}></canvas>
}

export default ProgressBar;