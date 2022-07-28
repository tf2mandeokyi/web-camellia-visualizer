/**
 * Uses lerp (linear interpolation) for now.
 * @todo Change function to cubic or whatever
 * @param t between 0 and 1
 */
export function interpolate(y0: number, y1: number, t: number) {
    return y0 + t * (y1 - y0);
}