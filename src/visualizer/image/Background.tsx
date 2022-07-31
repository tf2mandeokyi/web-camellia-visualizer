import React, { useRef } from 'react';
// import { Canvas, MeshProps, useFrame, useThree } from '@react-three/fiber';
// import * as THREE from 'three';

import './Background.css'


interface BackgroundProps {
    src?: string;
    magnify: number;
}


/**
 * @todo Needs some THREE.js shader programming here for the proper background blur effect
 * @param props 
 * @returns 
 */
const Background : React.FC<BackgroundProps> = (props) => {

    const backgroundWrapperRef = useRef<HTMLDivElement>(null);
    const backgroundImageRef = useRef<HTMLImageElement>(null);
    
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
                        transform: `scale(${ props.magnify })`
                    }}
                /> : <></>
            }
            <div className="background-pattern"></div>
        </div>
    )
}

export default Background;