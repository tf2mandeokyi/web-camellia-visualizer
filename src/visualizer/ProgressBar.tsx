import React, { useEffect, useRef } from 'react'
import { FillStrokeColor } from './FillStrokeColor'

import "./ProgressBar.css"


interface ProgressBarProps {
    color: FillStrokeColor
    left: number;
    y: number;
    width: number;
    current: number;
    total: number;
    ballRadius: number;
}


const ProgressBar : React.FC<ProgressBarProps> = (props) => {

    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if(!canvasRef.current) return;

        let { ballRadius, color } = props;

        const canvas = canvasRef.current;
        canvas.style.left = (props.left - ballRadius) + 'px';
        canvas.style.top = (props.y - ballRadius) + 'px';
        canvas.width = props.width + 2 * ballRadius;
        canvas.height = ballRadius * 2;

        const ctx = canvas.getContext('2d');
        if(!ctx) return;

        ctx.strokeStyle = color.stroke;
        ctx.fillStyle = color.fill;
        ctx.lineWidth = color.lineWidth;

        ctx.beginPath();
        ctx.moveTo(ballRadius, ballRadius-1);
        ctx.lineTo(canvas.width - ballRadius, ballRadius-1);
        ctx.lineTo(canvas.width - ballRadius, ballRadius+1);
        ctx.lineTo(ballRadius, ballRadius+1);
        ctx.closePath();
        ctx.fill();

        let x = props.width * props.current / props.total;
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