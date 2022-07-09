import React from "react";

import './ImageTemplate.css'


interface ImageTemplateProp {
    right: number;
    bottom: number;
    width: number;
    height: number;
}

const ImageTemplate : React.FC<ImageTemplateProp> = (props) => {
    return (
        <image 
            className="image-template" 
            width={props.width} 
            height={props.height}
            style={{
                right: props.right,
                bottom: props.bottom,
                width: props.width,
                height: props.height
            }}
        />
    );
}

export default ImageTemplate;