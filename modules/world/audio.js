import { GetContentLoadingManager } from "/modules/world/loading";

class AudioManager {
    constructor() {
        this.context = new AudioContext();
        this.tracks = {};
        this.effects = {};
        this.active = null;
        this.source = null;
    }

    start(cb) {
        let self = this;
        console.log("[audio] Waiting for audio context.");
        this.context.resume().then(() => {
            console.log("[audio] Context acquired.  Executing callback ...");
            cb();
        });
    }

    loadSound(name) {
        console.log("[audio] Loading sound effect: " + name);
        let loading = GetContentLoadingManager();
        loading.addItem();
        let url = "/sound/" + name + ".wav";

        this.effects[name] = {
            name: name,
            url: url,
            loaded: false,
            buffer: null
        };

        let request = new XMLHttpRequest();
        let effects = this.effects;
        request.open('GET', url, true);
        request.responseType = 'arraybuffer';
        request.onload = () => {
            this.context.decodeAudioData(request.response, function(buffer) {
                effects[name].loaded = true;
                effects[name].buffer = buffer;
                console.log("[audio] Loaded effect: " + name);
                loading.removeItem();
            });
        }
        request.send();
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

    playSound(name) {
        if(!this.effects[name].loaded) {
            console.error("Effect must be loaded before it can be played: " + name);
            return;
        }
        let buffer = this.effects[name].buffer;
        //FIXME: Does it leak if we don't disconnect the sources when we're done playing the sound?
        let source = this.context.createBufferSource();
        source.buffer = buffer;
        source.connect(this.context.destination);
        source.start(0);
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
        if(this.source != null) {
            this.source.stop();
            this.source.disconnect();
            this.source = null;
        }
        let buffer = this.tracks[name].buffer;
        this.source = this.context.createBufferSource();
        this.source.buffer = buffer;
        this.source.loop = true;
        this.source.connect(this.context.destination);
        this.source.start(0);        
    }
}

let audio = new AudioManager();

function GetAudioManager() {
    return audio;
}

export {GetAudioManager};