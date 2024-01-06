import { GetContentLoadingManager } from "/modules/world/loading";

class AudioManager {
    constructor() {
        this.context = new AudioContext();
        this.tracks = {};
        this.active = null;
    }

    start(cb) {
        let self = this;
        console.log("[audio] Waiting for audio context.");
        this.context.resume().then(() => {
            console.log("[audio] Context acquired.  Executing callback ...");
            cb();
        });
    }

    loadTrack(name) {
        console.log("[audio] Loading track: " + name);
        let loading = GetContentLoadingManager();
        loading.addItem();
        let url = "/music/" + name + "/" + name + ".wav";

        this.tracks[name] = {
            name: name,
            url: url,
            loaded: false,
            buffer: null
        };

        let request = new XMLHttpRequest();
        let tracks = this.tracks;
        request.open('GET', url, true);
        request.responseType = 'arraybuffer';
        request.onload = () => {
            this.context.decodeAudioData(request.response, function(buffer) {
                tracks[name].loaded = true;
                tracks[name].buffer = buffer;
                console.log("[audio] Loaded track: " + name);
                loading.removeItem();    
            });
        }
        request.send();
    }

    playTrack(name) {
        if(!this.tracks[name].loaded) {
            console.error("Track must be loaded before it can be played: " + name);
            return;
        }
        let buffer = this.tracks[name].buffer;
        let source = this.context.createBufferSource();
        source.buffer = buffer;
        source.connect(this.context.destination);
        source.start(0);
    }

    loopTrack(name) {
        if(!this.tracks[name].loaded) {
            console.error("Track must be loaded before it can be played: " + name);
            return;
        }
        let buffer = this.tracks[name].buffer;
        let source = this.context.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        source.connect(this.context.destination);
        source.start(0);        
    }
}

let audio = new AudioManager();

function GetAudioManager() {
    return audio;
}

export {GetAudioManager};