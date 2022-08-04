const DEFAULT_BMHARRIS = [ 0.35875, 0.48829, 0.14128, 0.01168 ];

export function blackmanHarris4(N: number, n: number, [ a0, a1, a2, a3 ] = DEFAULT_BMHARRIS) {
    let w = 2 * Math.PI * n / (N-1);
    return a0 - a1*Math.cos(w) + a2*Math.cos(2*w) - a3*Math.cos(3*w);
}


export class FastRealFourierTransform {

    X?: Float32Array;
    N: number;
    r: number;
    expTable: [ number, number ][];


    constructor(inputSize: number, sizeMultiplier: number) {

        if(!Number.isInteger(sizeMultiplier) || sizeMultiplier < 1) {
            throw new Error('sizeMultiplier must be an integer and bigger than 0');
        }

        this.N = inputSize;
        this.r = sizeMultiplier;

        this.expTable = new Array<[ number, number ]>(this.N * this.r);
        for(let k = 0; k < this.N * this.r; ++k) {
            let theta = -2 * Math.PI * k / this.N / this.r;
            this.expTable[k] = [ Math.cos(theta), Math.sin(theta) ];
        }
    }


    getSampleRate() {
        return this.N;
    }


    getSizeMultiplier() {
        return this.r;
    }


    realTransform(inputArray: Float32Array, method: 'radix-2' | 'radix-4') : Float32Array {
        
        const N = inputArray.length;
        if(N !== this.N) {
            throw new Error(`The array size is not ${this.N}`);
        }
        
        this.X = inputArray;
        let transformResult: number[];
        switch(method) {
            case 'radix-2':
                transformResult = this.radix2Transform(0, 1, N);
                break;
            case 'radix-4':
                transformResult = this.radix4Transform(0, 1, N);
                break;
        }

        let result = new Float32Array(this.N * this.r);
        for(let i = 0; i < this.N * this.r; ++i) {
            let re = transformResult[2 * i];
            let im = transformResult[2 * i + 1];
            result[i] = Math.sqrt(re * re + im * im);
        }

        return result;
    }


    private radix2Transform(start: number, step: number, size: number) : number[] {
        
        if(!this.X) throw new Error('Unknown error');
        let X = this.X, r = this.r;

        if(size === 2) {
            let x0 = X[start];
            let x1 = X[start + step];
            let D = new Array<number>(4 * r);
            for(let k = 0; k < r; ++k) {
                let [ Wkr, Wki ] = this.expTable[k * this.N / 2];
                D[2*(k  )  ] = x0 + x1 * Wkr;
                D[2*(k  )+1] =      x1 * Wki;
                D[2*(k+r)  ] = x0 - x1 * Wkr;
                D[2*(k+r)+1] =    - x1 * Wki;
            }
            return D;
        }
        else {
            let E = this.radix2Transform(start       , 2 * step, size / 2);
            let O = this.radix2Transform(start + step, 2 * step, size / 2);

            let D = new Array<number>(2 * r * size);
            for(let k = 0; k < r * size / 2; ++k) {

                let [ Wkr, Wki ] = this.expTable[k * this.N / size];

                let Ekr = E[2*k], Eki = E[2*k+1];
                let Okr = O[2*k], Oki = O[2*k+1];

                let WkOkr = Wkr * Okr - Wki * Oki;
                let WkOki = Wkr * Oki + Wki * Okr;

                D[2*(k         )  ] = Ekr + WkOkr;
                D[2*(k         )+1] = Eki + WkOki;
                D[2*(k+r*size/2)  ] = Ekr - WkOkr;
                D[2*(k+r*size/2)+1] = Eki - WkOki;
            }
            return D;
        }
    }


    private radix4Transform(start: number, step: number, size: number) : number[] {
        
        if(!this.X) throw new Error('Unknown error');
        let X = this.X, r = this.r;

        if(size === 2) {
            return this.radix2Transform(start, step, size);
        }
        else if(size === 4) {
            let x0 = X[start         ];
            let x1 = X[start +   step];
            let x2 = X[start + 2*step];
            let x3 = X[start + 3*step];
            
            let D = new Array<number>(4 * r);
            for(let k = 0; k < r; ++k) {

                let [ W1kr, W1ki ] = this.expTable[    k * this.N / 4];
                let [ W2kr, W2ki ] = this.expTable[2 * k * this.N / 4];
                let [ W3kr, W3ki ] = this.expTable[3 * k * this.N / 4];

                D[2*(k    )  ] = x0 + x1*W1kr + x2*W2kr + x3*W3kr;
                D[2*(k    )+1] =      x1*W1ki + x2*W2ki + x3*W3ki;

                D[2*(k+  r)  ] = x0 + x1*W1ki - x2*W2kr - x3*W3ki;
                D[2*(k+  r)+1] =    - x1*W1kr - x2*W2ki + x3*W3kr;

                D[2*(k+2*r)  ] = x0 - x1*W1kr + x2*W2kr - x3*W3kr;
                D[2*(k+2*r)+1] =    - x1*W1ki + x2*W2ki - x3*W3ki;

                D[2*(k+3*r)  ] = x0 - x1*W1ki - x2*W2kr + x3*W3ki;
                D[2*(k+3*r)+1] =    + x1*W1kr - x2*W2ki - x3*W3kr;
            }
            return D;
        }
        else {
            let C0 = this.radix4Transform(start         , 4 * step, size / 4);
            let C1 = this.radix4Transform(start +   step, 4 * step, size / 4);
            let C2 = this.radix4Transform(start + 2*step, 4 * step, size / 4);
            let C3 = this.radix4Transform(start + 3*step, 4 * step, size / 4);

            let D = new Array<number>(2 * r * size);
            for(let k = 0; k < r * size / 4; ++k) {

                let [ W1kr, W1ki ] = this.expTable[    k * this.N / size];
                let [ W2kr, W2ki ] = this.expTable[2 * k * this.N / size];
                let [ W3kr, W3ki ] = this.expTable[3 * k * this.N / size];

                let C0kr = C0[2*k], C0ki = C0[2*k+1];
                let C1kr = C1[2*k], C1ki = C1[2*k+1];
                let C2kr = C2[2*k], C2ki = C2[2*k+1];
                let C3kr = C3[2*k], C3ki = C3[2*k+1];

                let WkC1r = W1kr * C1kr - W1ki * C1ki;
                let WkC1i = W1kr * C1ki + W1ki * C1kr;
                let WkC2r = W2kr * C2kr - W2ki * C2ki;
                let WkC2i = W2kr * C2ki + W2ki * C2kr;
                let WkC3r = W3kr * C3kr - W3ki * C3ki;
                let WkC3i = W3kr * C3ki + W3ki * C3kr;

                D[2*(k           )  ] = C0kr + WkC1r + WkC2r + WkC3r;
                D[2*(k           )+1] = C0ki + WkC1i + WkC2i + WkC3i;

                D[2*(k+  r*size/4)  ] = C0kr + WkC1i - WkC2r - WkC3i;
                D[2*(k+  r*size/4)+1] = C0ki - WkC1r - WkC2i + WkC3r;

                D[2*(k+2*r*size/4)  ] = C0kr - WkC1r + WkC2r - WkC3r;
                D[2*(k+2*r*size/4)+1] = C0ki - WkC1i + WkC2i - WkC3i;

                D[2*(k+3*r*size/4)  ] = C0kr - WkC1i - WkC2r + WkC3i;
                D[2*(k+3*r*size/4)+1] = C0ki + WkC1r - WkC2i - WkC3r;
            }
            return D;
        }
    }
}