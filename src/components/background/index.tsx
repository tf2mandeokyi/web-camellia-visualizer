import React, { useRef, useCallback } from 'react';
// import { Canvas, MeshProps, useFrame, useThree } from '@react-three/fiber';
// import * as THREE from 'three';

import './index.css'


interface BackgroundProps {
    src?: string;
    magnify: number;
    stripWidth: number;
    blur: number;
}


/**
 * TODO: Needs some THREE.js shader programming here for the proper background blur effect
 * @param props 
 * @returns 
 */
const Background : React.FC<BackgroundProps> = (props) => {

    const backgroundWrapperRef = useRef<HTMLDivElement>(null);
    const backgroundImageRef = useRef<HTMLImageElement>(null);
    
    const getRelative = useCallback((x: number) => {
        return x * props.stripWidth / 9.67
    }, [ props.stripWidth ]);

    let backgroundPattern = `repeating-linear-gradient(-45deg, 
        var(--bgpattern-color1), var(--bgpattern-color1) ${getRelative(4.5)}px, 
        var(--bgpattern-color2) ${getRelative(6.5)}px, var(--bgpattern-color2) ${getRelative(7.67)}px, 
        var(--bgpattern-color1) ${getRelative(9.67)}px
    )`;

    return (
        <div id="background-wrapper" ref={ backgroundWrapperRef }>
            { 
                props.src ? 
                <img 
                    id="background" 
                    alt="background" 
                    ref={ backgroundImageRef } 
                    src={ props.src }
                    style={{
                        filter: `blur(${ props.blur }px)`,
                        transform: `scale(${ props.magnify })`
                    }}
                /> : <></>
            }
            <div className="background-pattern" style={{
                background: backgroundPattern
            }}></div>
        </div>
    )
}

export default Background;