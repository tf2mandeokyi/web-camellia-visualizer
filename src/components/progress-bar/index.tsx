import React, { useCallback, useEffect, useRef } from 'react'
import { FillStrokeColor } from '../../lib/color/FillStrokeColor'

import "./index.css"


export type ProgressBarClickHandler = (value: number) => void;


interface ProgressBarProps {
    color: FillStrokeColor
    centerX: number;
    y: number;
    width: number;
    current: number;
    total: number;
    ballRadius: number;
    strokeWidth: number;
    onMouseUpdate?: ProgressBarClickHandler;
}


const ProgressBar : React.FC<ProgressBarProps> = (props) => {

    const canvasRef = useRef<HTMLCanvasElement>(null);


    const mouseUpdate = useCallback((event: MouseEvent | React.MouseEvent) => {
        let relX = event.clientX - props.centerX + props.width / 2;
        let t = relX / props.width;
        if(t < 0) t = 0;
        if(t > 1) t = 1;
        if(props.onMouseUpdate) props.onMouseUpdate(t * props.total);
    }, [ props ]);


    const globalMouseDownHandler = useCallback((event: MouseEvent) => {
        if(!canvasRef.current) return;

        let x = event.clientX, y = event.clientY;
        let rect = canvasRef.current.getBoundingClientRect();
        if(x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
            mouseUpdate(event);
        }
    }, [ mouseUpdate ]);


    useEffect(() => {
        if(!canvasRef.current) return;

        let { ballRadius, color } = props;

        const canvas = canvasRef.current;
        canvas.style.left = (props.centerX - props.width / 2 - ballRadius) + 'px';
        canvas.style.top = (props.y - ballRadius) + 'px';
        canvas.width = props.width + 2 * ballRadius;
        canvas.height = ballRadius * 2 + 1;

        const ctx = canvas.getContext('2d');
        if(!ctx) return;

        ctx.strokeStyle = color.stroke;
        ctx.fillStyle = color.fill;
        ctx.lineWidth = color.lineWidth;

        ctx.beginPath();
        ctx.moveTo(ballRadius, ballRadius - props.strokeWidth / 2);
        ctx.lineTo(canvas.width - ballRadius, ballRadius - props.strokeWidth / 2);
        ctx.lineTo(canvas.width - ballRadius, ballRadius + props.strokeWidth / 2);
        ctx.lineTo(ballRadius, ballRadius + props.strokeWidth / 2);
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


    useEffect(() => {
        window.addEventListener('mousedown', globalMouseDownHandler);
        return () => {
            window.removeEventListener('mousedown', globalMouseDownHandler);
        }
    })


    return (
        <canvas className="progress-bar" ref={ canvasRef }></canvas>
    );
}

export default ProgressBar;