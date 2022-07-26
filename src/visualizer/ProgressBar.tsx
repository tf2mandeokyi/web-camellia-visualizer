import React, { useCallback, useEffect, useRef } from 'react'
import { FillStrokeColor } from './FillStrokeColor'

import "./ProgressBar.css"


export type ProgressBarClickHandler = (value: number) => void;


interface ProgressBarProps {
    color: FillStrokeColor
    left: number;
    y: number;
    width: number;
    current: number;
    total: number;
    ballRadius: number;
    onClick?: ProgressBarClickHandler;
}


const ProgressBar : React.FC<ProgressBarProps> = (props) => {

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isDragging = useRef<boolean>(false);


    const mouseUpdate = useCallback((event: MouseEvent | React.MouseEvent) => {
        let relX = event.clientX - props.left;
        let t = relX / props.width;
        if(t < 0) t = 0;
        if(t > 1) t = 1;
        if(props.onClick) props.onClick(t * props.total);
    }, [ props ]);


    const globalMouseDownHandler = useCallback((event: MouseEvent) => {
        if(!canvasRef.current) return;

        let x = event.clientX, y = event.clientY;
        let rect = canvasRef.current.getBoundingClientRect();
        if(x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
            isDragging.current = true;
            mouseUpdate(event);
        }
    }, [ mouseUpdate ]);


    const globalMouseMoveHandler = useCallback((event: MouseEvent) => {
        if(!canvasRef.current || !isDragging.current) return;
        mouseUpdate(event);
    }, [ mouseUpdate ]);


    const globalMouseUpHandler = useCallback(() => {
        isDragging.current = false;
    }, []);


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


    useEffect(() => {
        window.addEventListener('mousedown', globalMouseDownHandler);
        window.addEventListener('mouseup', globalMouseUpHandler);
        window.addEventListener('mousemove', globalMouseMoveHandler);
        return () => {
            window.removeEventListener('mousedown', globalMouseDownHandler);
            window.removeEventListener('mouseup', globalMouseUpHandler);
            window.removeEventListener('mousemove', globalMouseMoveHandler);
        }
    })


    return (
        <canvas className="progress-bar" ref={ canvasRef }></canvas>
    );
}

export default ProgressBar;