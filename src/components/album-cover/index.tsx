import React from "react";

import './index.css'


export type AlbumCoverClickHandler = () => void;


interface AlbumCoverProp {
    centerX: number;
    centerY: number;
    width: number;
    height: number;
    src?: string;
    onClick?: AlbumCoverClickHandler;
}

const AlbumCover : React.FC<AlbumCoverProp> = (props) => {
    return props.src ? (
        <img 
            className="album-cover" 
            width={ props.width } 
            height={ props.height }
            style={{
                left: props.centerX - props.width / 2,
                top: props.centerY - props.height / 2,
                width: props.width,
                height: props.height,
                cursor: props.onClick ? 'pointer' : 'inherit'
            }}
            src={ props.src }
            alt="album cover"
            onClick={ props.onClick }
        />
    ) : (
        <div
            className="no-album-cover"
            style={{
                left: props.centerX - props.width / 2,
                top: props.centerY - props.height / 2,
                width: props.width,
                height: props.height,
                cursor: props.onClick ? 'pointer' : 'inherit'
            }}
            onClick={ props.onClick }
        >
            <span className="undraggable">Insert album by entering its image url,</span>
            <span className="undraggable">​</span>
            <span className="undraggable">And click me to play/pause the inserted music!</span>
        </div>
    );
}

export default AlbumCover;