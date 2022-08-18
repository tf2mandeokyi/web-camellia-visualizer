export interface FillStrokeColor {
    fill: string | CanvasGradient | CanvasPattern;
    stroke: string | CanvasGradient | CanvasPattern;
    lineWidth: number;
}


export function mergeColor(color: Partial<FillStrokeColor> | undefined, defaultColor: FillStrokeColor) : FillStrokeColor {
    if(color === undefined || color === null) return defaultColor; 
    return {
        fill: color.fill ?? defaultColor.fill,
        stroke: color.stroke ?? defaultColor.stroke,
        lineWidth: color.lineWidth ?? defaultColor.lineWidth
    };
}