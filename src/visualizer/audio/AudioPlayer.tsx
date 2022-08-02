export class AudioPlayer {

    context: AudioContext;

    albumCoverUri?: string;
    buffer?: AudioBuffer;
    bufferSource?: AudioBufferSourceNode;
    private playing: boolean;


    constructor() {
        this.context = new AudioContext();
        this.playing = false;
    }


    async insertAudioFile(input: File) {
        try {
            this.albumCoverUri = await this.extractAlbumCover(input);
        } catch(_) {}

        const inputBuffer = await input.arrayBuffer();
        if(!inputBuffer) throw new Error('Empty file array buffer');
        return this.insertAudioBuffer(inputBuffer);
    }


    async insertAudioBuffer(buffer: ArrayBuffer) {
        const decoded = await this.context.decodeAudioData(buffer);
        if(!decoded) throw new Error('Audio decode error');

        this.buffer = decoded;
        this.playing = false;

        return decoded;
    }


    isAudioInserted() {
        return this.buffer !== undefined;
    }


    isPlaying() {
        return this.playing;
    }


    start(seconds: number) {
        if(!this.buffer) throw new Error('Audio not inserted');

        const bufferSource = this.context.createBufferSource();
        bufferSource.buffer = this.buffer;
        bufferSource.connect(this.context.destination);

        bufferSource.start(0, seconds);
        this.bufferSource = bufferSource;
        this.playing = true;
    }


    stop() {
        if(!this.buffer) throw new Error('Audio not inserted');

        this.bufferSource?.stop();
        this.playing = false;
    }
    

    async extractAlbumCover(file: File) : Promise<string> {
        return new Promise<string>((res, rej) => {
            window.jsmediatags.read(file, {
                onSuccess: ({ tags }) => {
                    let { picture } = tags;
                    if(!picture) return;
    
                    let base64String = picture.data.map((c) => String.fromCharCode(c)).reduce((prev, cur) => prev + cur);
                    let imageUri = "data:" + picture.format + ";base64," + window.btoa(base64String);
    
                    res(imageUri);
                },
                onError: rej
            })
        })
    }

}