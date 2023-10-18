export type Color = string | CanvasGradient | CanvasPattern;

export interface FillStrokeColor {
    fill: Color;
    stroke: Color;
    lineWidth: number;
}


export function mergeColor(defaultColor: FillStrokeColor, ...colors: (Partial<FillStrokeColor> | undefined)[]) : FillStrokeColor {
    if(colors === undefined || colors === null) return defaultColor;

    let { fill, stroke, lineWidth } = defaultColor;
    for(let color of colors) {
        if(!color) continue;
        if(color.fill) fill = color.fill;
        if(color.stroke) stroke = color.stroke;
        if(color.lineWidth) lineWidth = color.lineWidth;
    }

    return { fill, stroke, lineWidth };
}