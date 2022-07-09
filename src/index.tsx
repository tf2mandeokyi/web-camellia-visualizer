import React from 'react';
import ReactDOM from 'react-dom/client';
import reportWebVitals from './reportWebVitals';
import CamelliaVisualzer from './visualizer/CamelliaVisualzer';

import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
        <CamelliaVisualzer
            defaultColor={{
                fill: "blue",
                stroke: "blue",
                lineWidth: 1
            }}
            barSpectrum={{
                fill: "red",
                stroke: "red",
                lineWidth: 2
            }}
            framerate={60}
        />
    </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
