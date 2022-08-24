import React from 'react';
import ReactDOM from 'react-dom/client';
import reportWebVitals from './reportWebVitals';
import CamelliaVisualizer from './components/visualizer';

import './index.css';


ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
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
            framerate={ 60 }
        />
    </React.StrictMode>
);


// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
