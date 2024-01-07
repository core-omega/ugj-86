import {ForceShowOverlay, ForceHideOverlay} from "/modules/display/show";
import {GetAudioManager} from "/modules/world/audio";
import {GetPlayer} from "/modules/character/player";
import {GetSkills} from "/modules/encounter/skills";
import {GetCreatures, RESULT_FIGHT, RESULT_NONE, RESULT_RESOLVE} from "/modules/encounter/creatures";
import Mustache from '/lib/mustache';

class EncounterManager {
    static ENCOUNTER_RATE = 0.7;  // on average, one encounter per every 10 game km
    static ENCOUNTER_STDEV = 0.3;
    static ENCOUNTER_MAX_RATE = 0.3;
    static ENCOUNTER_CREATURE_FREQUENCY = 0.4;
    static ENCOUNTER_RESOLUTION_TIMEOUT = 5000;

    static ENCOUNTER_LOG_CHARDELAY = 50;
    
    // state machine
    static NO_ENCOUNTER = 1;
    static ENCOUNTER_START = 2;
    static ENCOUNTER_FIGHT = 3;

    constructor() {
        this.state = EncounterManager.NO_ENCOUNTER;
        this.lastEncounter = 0.0;
        this.logOutput = "";
        this.logOutputIndex = 0;
        this.lastOutput = window.performance.now();
        this.nextEncounter = this.gaussian(EncounterManager.ENCOUNTER_RATE, EncounterManager.ENCOUNTER_STDEV);
        if(this.nextEncounter - this.lastEncounter < EncounterManager.ENCOUNTER_MAX_RATE) {
            this.nextEncounter = this.lastEncounter + EncounterManager.ENCOUNTER_MAX_RATE;
        }
        console.log("[encounter] First encounter at: " + this.nextEncounter);
    }

    init() {

    }

    gaussian(mean = 0, stdev = 1) {
        const u = 1 - Math.random(); // Converting [0,1) to (0,1]
        const v = Math.random();
        const z = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
        // Transform to the desired mean and standard deviation:
        return z * stdev + mean;
    }

    /* We use the rendering loop as a general update loop - not terribly clean, but it'll work for now. */
    render() {
        let player = GetPlayer();
        if(player.traveled > this.nextEncounter && this.state == EncounterManager.NO_ENCOUNTER) {
            console.log("[encounter] Triggering new encounter.");
            this.lastEncounter = this.nextEncounter;
            this.nextEncounter = this.lastEncounter + this.gaussian(EncounterManager.ENCOUNTER_RATE, EncounterManager.ENCOUNTER_STDEV);
            if(this.nextEncounter - this.lastEncounter < EncounterManager.ENCOUNTER_MAX_RATE) {
                this.nextEncounter = this.lastEncounter + EncounterManager.ENCOUNTER_MAX_RATE;
            }    
            console.log("[encounter] Next encounter at: " + this.nextEncounter);
            this.state = EncounterManager.ENCOUNTER_START;
            this.setup();
        }

        this.updateLog();
    }

    updateLog() {
        if(document.getElementById('encounter-log')) {
            if(window.performance.now() - this.lastOutput > EncounterManager.ENCOUNTER_LOG_CHARDELAY) {
                if(this.logOutput.charAt(this.logOutputIndex) == '<') {
                    let startIndex = this.logOutputIndex;
                    while(this.logOutput.charAt(this.logOutputIndex) != '>') {
                        ++this.logOutputIndex;
                    }
                    let endIndex = this.logOutputIndex;
                    console.log("[encounter-log] " + this.logOutput.substring(startIndex, endIndex + 1));
                    ++this.logOutputIndex;
                }
                if(this.logOutputIndex >= this.logOutput.length) {
                    return;
                }
                document.getElementById('encounter-log').innerHTML = this.logOutput.substring(0, this.logOutputIndex + 1);
                ++this.logOutputIndex;
                this.lastOutput = window.performance.now();
                document.getElementById('encounter-log').scrollTop = document.getElementById('encounter-log').scrollHeight;
            }
        }
    }

    clearLog() {
        this.logOutput = "";
        this.logOutputIndex = 0;
        this.lastOutput = window.performance.now();
        document.getElementById('encounter-log').innerHTML = "";
    }

    log(text) {
        text += "<br />"
        this.logOutput = this.logOutput + text;
    }

    combat() {
        if(this.currentEncounter.cohesion <= 0) {
            console.log("[encounter] Won fight.");
        }
        let player = GetPlayer();
        let self = this;
        GetSkills()["attack"].execute(self, player, this.currentEncounter);
        GetSkills()["attack"].execute(self, this.currentEncounter, player);
        console.log(this.currentEncounter);
        document.getElementById('enemy-life').innerHTML = Mustache.render("Cohesion: {{cohesion}} / {{cohesionMax}}", this.currentEncounter);
        document.getElementById('player-life').innerHTML = Mustache.render("Cohesion: {{cohesion}} / {{cohesionMax}}", player);
    }

    fight() {
        let audio = GetAudioManager();
        audio.loopTrack("Battle");
        this.logOutput = "";
        console.log("[encounter] Setting up fight with `" + this.currentEncounter.name + "`.");
        let output = Mustache.render(`
            <div class='battle'>
                <div class='battle-title'>FIGHT</div>
                <hr />
                <div class='enemy-description'>{{name}} (Level {{level}})</div>
                <div class='enemy-life' id='enemy-life'>Cohesion: {{cohesion}} / {{cohesionMax}}</div>
                <hr />
                <div class='battle-menu-wrapper'>
                    <div class='encounter-player'>
            `, this.currentEncounter);
        output += Mustache.render(`
                        <div class='player-description'>{{name}} (Level {{level}})</div>
                        <div class='player-life' id='player-life'>Cohesion: {{cohesion}} / {{cohesionMax}}</div>
        `, GetPlayer());
        output += Mustache.render(`                        
                    </div>
                    <div class='encounter-option' id='fight-option'>Attack</div>
                    <div class='encounter-option' id='flee-option'>Flee</div>
                </div>
                <hr />
                <div class='encounter-log' id='encounter-log'></div>
                <div class='encounter-end' id='encounter-end'></div>
            </div>
        `, this.currentEncounter);

        ForceShowOverlay(output);
        this.clearLog();
        this.log("Entering combat.");

        document.getElementById('fight-option').addEventListener('click', event => {
            this.combat();
        });

        document.getElementById('flee-option').addEventListener('click', event => {
            this.flee();
        });
    }

    setup() {
        let audio = GetAudioManager();
        audio.loopTrack("Encounter");
        this.logOutput = "";
        console.log("[encounter] Setting up new encounter.");
        this.currentEncounter = GetCreatures()["blob1"];
        const output = Mustache.render(`
            <div class='encounter'>
                <div class='encounter-title'>Encounter</div>
                <hr />
                <div class='encounter-description'>{{name}} (Level {{level}})</div>
                <hr />
                <div class='encounter-wrapper'>
                    <div class='encounter-option' id='talk-option'>Talk</div>
                    <div class='encounter-option' id='fight-option'>Fight</div>
                    <div class='encounter-option' id='leave-option'>Leave</div>
                </div>
                <hr />
                <div class='encounter-log' id='encounter-log'></div>
            </div>`, this.currentEncounter);

        ForceShowOverlay(output);
        this.clearLog();
        this.currentEncounter.appearance(this);

        var self = this;
        document.getElementById('talk-option').addEventListener('click', () => {
            console.log("[encounter] 'talk' selected.");
            let result = this.currentEncounter.talk(self, GetPlayer(), this.currentEncounter);
            if(result == RESULT_FIGHT) {
                console.log("[encounter] 'talk' result: proceeding to fight.");
                this.state = EncounterManager.ENCOUNTER_FIGHT;
            } else if(result == RESULT_RESOLVE) {
                console.log("[encounter] 'talk' result: resolving encounter after delay.");
                setTimeout(() => {
                    ForceHideOverlay(); 
                    this.state = EncounterManager.NO_ENCOUNTER;
                }, EncounterManager.ENCOUNTER_RESOLUTION_TIMEOUT);
            } else {
                console.log("[encounter] 'talk' result: no effect.");
            }

        }, false);

        document.getElementById('fight-option').addEventListener('click', () => {
            console.log("[encounter] 'fight' selected.");
            this.log("<span class='result'>Fight: </span> <span class='fight-text'>THIS CREATURE SHALL BE DESTROYED!</span>");
            setTimeout(() => {
                this.fight();
            }, EncounterManager.ENCOUNTER_RESOLUTION_TIMEOUT);

        }, false);

        document.getElementById('leave-option').addEventListener('click', () => {
            let result = this.currentEncounter.leave(self, GetPlayer(), this.currentEncounter);
            if(result == RESULT_FIGHT) {
                console.log("[encounter] 'leave' result: proceeding to fight.");
                this.state = EncounterManager.ENCOUNTER_FIGHT;
            } else if(result == RESULT_RESOLVE) {
                console.log("[encounter] 'leave' result: resolving encounter after delay.");
                setTimeout(() => {
                    ForceHideOverlay(); 
                    audio.loopTrack("Adventure");
                    this.state = EncounterManager.NO_ENCOUNTER;
                }, EncounterManager.ENCOUNTER_RESOLUTION_TIMEOUT);
            } else {
                console.log("[encounter] 'leave' result: no effect.");
            }
        }, false);
    }
}

let encounter = new EncounterManager();

function GetEncounterManager() {
    return encounter;
}

export {GetEncounterManager};
