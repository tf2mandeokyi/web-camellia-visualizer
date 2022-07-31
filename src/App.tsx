import React from 'react';
import CamelliaVisualizer from './visualizer/CamelliaVisualizer'

interface AppProps {
    framerate: number;
}

const App : React.FC<AppProps> = (props) => {
    return (
        <CamelliaVisualizer
            defaultColor={{
                fill: "white",
                stroke: "white",
                lineWidth: 2
            }}
            curveSpectrum={{
                stroke: "transparent"
            }}
            // barSpectrum={{
            //     fill: "#ff00aa",
            //     stroke: "#ff00aa",
            //     lineWidth: 2
            // }}
            // progressBar={{
            //     fill: "#00ffab"
            // }}
            framerate={ props.framerate }
        />
    )
}

export default App;