import {GetPlayer} from "/modules/character/player";

class EncounterManager {
    static ENCOUNTER_RATE = 1.0;  // on average, one encounter per every 10 game km
    static ENCOUNTER_STDEV = 0.3;

    constructor() {
        this.lastEncounter = 0.0;
        this.nextEncounter = this.gaussian(EncounterManager.ENCOUNTER_RATE, EncounterManager.ENCOUNTER_STDEV);
        console.log("[encounter] First encounter at: " + this.nextEncounter);
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
        if(player.traveled > this.nextEncounter) {
            console.log("[encounter] Triggering new encounter.");
            this.lastEncounter = this.nextEncounter;
            this.nextEncounter = this.lastEncounter + this.gaussian(EncounterManager.ENCOUNTER_RATE, EncounterManager.ENCOUNTER_STDEV);
            console.log("[encounter] Next encounter at: " + this.nextEncounter);
        }
    }

    setupNext() {

    }
}

let encounter = new EncounterManager();

function GetEncounterManager() {
    return encounter;
}

export {GetEncounterManager};
