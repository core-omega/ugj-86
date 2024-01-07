let skills = {
    "attack": {
        id: "attack",
        name: "Attack",
        execute: (context, source, target) => {
            let power = 5 * source.level + (Math.random() * 2.5 * source.level);
            power = Math.floor(power);
            context.log(source.name + " smacks " + target.name + ", reducing their coherence by " + power + " points.");
            target.cohesion -= power;
            if(target.cohesion < 0) {
                target.cohesion = 0;
            }
        }
    },
    "heal1": {
        id: "heal1",
        name: "Minor Heal",
        execute: (context, source, target) => {
            let power = 20 + (5 * source.level) + ((Math.random() / 4) * 10.0 * source.level);
            power = Math.floor(power);
            context.log(source.name + " performs <span class='restore-skill'>Minor Heal</span>, restoring " + power + " points of coherence.");
            source.cohesion += power;
            if(source.cohesion > source.cohesionMax) {
                source.cohesion = source.cohesionMax;
            }
        }
    }
};

function GetSkills() {
    return skills;
}

export {GetSkills};