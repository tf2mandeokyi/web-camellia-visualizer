import { useCallback, useEffect, useRef } from "react";

interface ScheduledRepeaterProps {
    callback: (steps: number) => void;
    framerate: number;
}

const ScheduledRepeater : React.FC<ScheduledRepeaterProps> = (props) => {

    const loopStartRef = useRef<number | undefined>();
    const nextLoopAtRef = useRef<number>(0);
    const loopIdRef = useRef<number>();

    const loop = useCallback(() => {

        let next = nextLoopAtRef.current;
        const now = new Date().getTime();
        if (!loopStartRef.current) {
            loopStartRef.current = now;
            next = now + 1000 / props.framerate;
            nextLoopAtRef.current = next;
        }

        if(now >= next) {
            let steps = 0;
            do {
                next += 1000 / props.framerate;
                ++steps;
            } while(now >= next);
            nextLoopAtRef.current = next;

            props.callback(steps);
        }

        loopIdRef.current = requestAnimationFrame(loop);
    }, [ props ]);

    useEffect(() => {
        loop();
        return () => {
            if(loopIdRef.current) cancelAnimationFrame(loopIdRef.current);
        }
    }, [ props, loop ]);

    return <></>;
}

export default ScheduledRepeater;