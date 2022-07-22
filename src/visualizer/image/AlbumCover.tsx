import React from "react";

import './AlbumCover.css'


interface ImageTemplateProp {
    right: number;
    bottom: number;
    width: number;
    height: number;
    src?: string;
}

const AlbumCover : React.FC<ImageTemplateProp> = (props) => {
    return props.src ? (
        <img 
            className="image-template" 
            width={ props.width } 
            height={ props.height }
            style={{
                right: props.right,
                bottom: props.bottom,
                width: props.width,
                height: props.height
            }}
            src={ props.src }
            alt="album cover"
        />
    ) : <></>;
}

export default AlbumCover;