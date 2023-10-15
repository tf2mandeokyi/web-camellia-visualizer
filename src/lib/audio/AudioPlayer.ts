export interface AudioFileMetaData {
    title?: string
    artist?: string
    album?: string
    imageUri?: string
}

export class AudioPlayer {

    private context: AudioContext;
    private gainNode: GainNode;

    private buffer?: AudioBuffer;
    private bufferSource?: AudioBufferSourceNode;

    audioMetadata?: AudioFileMetaData;
    onDonePlaying?: () => void;

    private playing: boolean;
    /** In seconds. */
    private startTime: number;
    /** In seconds. */
    private time: number;


    constructor() {
        this.context = new AudioContext();
        this.playing = false;
        this.startTime = this.getNow();
        this.time = 0;

        this.gainNode = this.context.createGain();
        this.gainNode.connect(this.context.destination);
    }


    setDonePlayingHandler(handler: () => void) : AudioPlayer {
        this.onDonePlaying = handler;
        return this;
    }


    async insertAudioFile(input: File) {
        try {
            this.audioMetadata = await this.extractAudioMetadata(input);
        } catch(_) {}

        const inputBuffer = await input.arrayBuffer();
        if(!inputBuffer) throw new Error('Empty file array buffer');

        return this.insertAudioBuffer(inputBuffer);
    }


    async insertAudioBuffer(buffer: ArrayBuffer) {
        const decoded = await this.context.decodeAudioData(buffer);
        if(!decoded) throw new Error('Audio decode error');

        if(this.buffer) this.stop();

        this.buffer = decoded;
        this.playing = false;
        this.time = 0;

        return decoded;
    }


    isAudioInserted() {
        return this.buffer !== undefined;
    }


    isPlaying() {
        return this.playing;
    }


    start(seconds?: number) {
        if(!this.buffer) throw new Error('Audio not inserted');

        const bufferSource = this.context.createBufferSource();
        bufferSource.buffer = this.buffer;
        bufferSource.connect(this.gainNode);

        let now = this.getNow();
        if(seconds) {
            bufferSource.start(0, seconds);
            this.startTime = now - seconds;
        }
        else {
            bufferSource.start(0, this.time);
            this.startTime = now - this.time;
        }
        this.bufferSource = bufferSource;
        this.playing = true;
    }


    stop(resetTime? : boolean) {
        if(!this.buffer) throw new Error('Audio not inserted');

        this.bufferSource?.stop();
        this.playing = false;

        if(resetTime) {
            this.time = 0;
        } else {
            let now = this.getNow();
            this.time = now - this.startTime;
        }
    }


    setTime(seconds: number, replayIfPlaying?: boolean) {
        let playing = this.playing;
        this.stop();
        if(playing && replayIfPlaying) this.start(seconds);
        else this.time = seconds;
    }


    /** In seconds. */
    getTime() {
        this.updateTime();
        return this.time;
    }


    /** In seconds. */
    getDuration() {
        if(!this.buffer) throw new Error('Audio not inserted');
        return this.buffer.duration;
    }


    /**
     * @param volume Ranges from 0 to 1
     */
    setVolume(volume: number) {
        this.gainNode.gain.value = volume;
    }


    /** In seconds. */
    private getNow() {
        return new Date().getTime() / 1000;
    }


    private updateTime() {
        if(!this.buffer) return;

        let now = new Date().getTime() / 1000;
        if(this.playing) {
            this.time = now - this.startTime;
        } else {
            this.startTime = now - this.time;
        }

        if(this.time > this.buffer.duration) {
            this.playing = false;
            this.time = 0;
            this.startTime = now;
            if(this.onDonePlaying) this.onDonePlaying();
        }
    }


    async extractAudioMetadata(file: File) : Promise<AudioFileMetaData | undefined> {
        return new Promise<AudioFileMetaData | undefined>((res) => {
            window.jsmediatags.read(file, {
                onSuccess: ({ tags }) => {
                    let { title, artist, album, picture } = tags;

                    let imageUri: string | undefined = undefined;
                    if(picture) {
                        let base64String = picture.data.map((c) => String.fromCharCode(c)).reduce((prev, cur) => prev + cur);
                        imageUri = "data:" + picture.format + ";base64," + window.btoa(base64String);
                    }
    
                    let result: any = { title, artist, album, imageUri };
                    Object.keys(result).forEach(key => result[key] === undefined ? delete result[key] : {});
                    res(result)
                },
                onError: () => res(undefined)
            })
        })
    }

}