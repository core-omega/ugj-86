import {GetSkills} from "/modules/encounter/skills.js";

const RESULT_NONE = 'none';
const RESULT_FIGHT = 'fight';
const RESULT_RESOLVE = 'resolve';

let skills = GetSkills();

let creatures = {
    "blob1": {
        id: "blob1",
        name: "An Oozing Puddle of Sewage",
        level: 1,
        xp: 25,
        skills: [GetSkills()["attack"], GetSkills()["heal1"]],
        cohesion: 15,
        cohesionMax: 15,
        appearance: (context, player, creature) => {
            context.log("An oozing puddle of sewage appears nearby.");
        },
        idle: (context, player, creature) => {
            context.log("An oozing puddle of sewage bubbles happily.");
        },
        talk: (context, player, creature) => {
            context.log("<span class='result'>Talk:</span> The oozing puddle of sewage gurgles politely in response to your query.");
            return RESULT_NONE;
        },
        leave: (context, player, creature) => {
            context.log("<span class='result'>Leave:</span> You float over the harmless, oddly sentient puddle and move along.");
            return RESULT_RESOLVE;
        }
    },
    "blob2": {
        id: "blob2",
        name: "A Quivering Blob of Sewage",
        level: 5,
        xp: 300,
        skills: [GetSkills()["attack"], GetSkills()["heal1"]],
        cohesion: 90,
        cohesionMax: 90,
        appearance: (context, player, creature) => {
            context.log("A quivering blob of sewage appears nearby.");
        },
        idle: (context, player, creature) => {
            context.log("A quivering blob of sewage jiggles aggressively.");
        },
        talk: (context, player, creature) => {
            context.log("<span class='result'>Talk:</span> The quivering blob of sewage is deeply offended by your inquiry and suddenly attacks!");
            return RESULT_FIGHT;
        },
        leave: (context, player, creature) => {
            context.log("<span class='result'>Leave:</span> Ew.  Time to go!");
            return RESULT_RESOLVE;
        }
    },
    "death": {
        id: "death",
        name: "The Spectre of Death",
        level: 99,
        xp: 1,
        skills: [GetSkills()["attack"]],
        cohesion: 999999,
        cohesionMax: 999999,
        appearance: (context, player, creature) => {
            context.log("The spectre of death is busily harvesting souls nearby.");
        },
        idle: (context, player, creature) => {
            context.log("A shimmering flood of souls swirls around Death's scythe as he channels them through a glowing portal in space and time.");
        },
        talk: (context, player, creature) => {
            context.log("<span class='result'>Talk:</span> Death politely nods its grotesque head in your direction, but is otherwise too busy to talk.");
            return RESULT_NONE;
        },
        leave: (context, player, creature) => {
            context.log("<span class='result'>Leave:</span> You leave the spectre of death to perform its work in peace.");
            return RESULT_RESOLVE;
        }
    }
};

function GetCreatures() {
    return creatures;
}

export {GetCreatures, RESULT_NONE, RESULT_FIGHT, RESULT_RESOLVE};
