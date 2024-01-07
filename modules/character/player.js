import { GetRenderManager } from "/modules/display/render.js";
import { ForceShowOverlay } from "/modules/display/show.js";
import { GetPhysicsManager } from "/modules/physics/physics.js";
import { GetInputManager } from "/modules/world/input.js";
import { GetFloorMap } from "/modules/world/floor.js";
import { GetAudioManager } from "/modules/world/audio.js";
import { PendingOverlay, ForceHideOverlay } from "/modules/display/show.js";
import { EncounterManager, GetEncounterManager } from "/modules/world/encounter.js";

import * as THREE from 'three';
import Mustache from '/lib/mustache';

class Player {
    static RADIUS = 0.2;
    static COHESION_START = 250;  // hp
    static FORCE_START = 10;      // normal attack power
    static AFFINITY_START = 10;   // special attack power
    static MOVEMENT_RATE = 0.00002;  // FIXME: ... I feel like I might be doing something wrong ... ?
    static MAX_TOGGLE_RATE = 0.5;
    static MIN_INTERACT_DISTANCE = 1.1;

    constructor() { 
        this.cohesionMax = Player.COHESION_START;
        this.cohesion = this.cohesionMax;
        this.force = Player.FORCE_START;
        this.affinity = Player.AFFINITY_START;
        this.name = "The Ghost";
        this.experience = 0;
        this.level = 1;
        this.items = { };
        this.traveled = 0.0;
        this.needsRenderInit = true;
        this.position = [0.0, 0.0];
        this.needsCreation = true;
        this.showCharacter = false;
        this.showInventory = false;
        this.toggled = {
            'c': window.performance.now(), 
            'i': window.performance.now(), 
            'space': window.performance.now()
        };
    }

    distance(src, dst) {
        return Math.sqrt(
            ((src[0] - dst[0]) * (src[0] - dst[0])) + 
            ((src[1] - dst[1]) * (src[1] - dst[1]))
        );
    }

    canInteract(location) {
        if(this.distance(this.position, location) < Player.MIN_INTERACT_DISTANCE) {
            return true;
        }
        return false;
    }

    createPhysicsObject() {
        let floor = GetFloorMap();
        let entry = floor.getEntry();
        let physics = GetPhysicsManager();
        let input = GetInputManager();
        let encounter = GetEncounterManager();

        this.playerId = physics.addDynamicObject(entry[1], entry[0], Player.RADIUS);

        Matter.Events.off(physics.getEngine(), 'beforeUpdate');

        Matter.Events.on(physics.getEngine(), 'beforeUpdate', event => {
            // Don't process input if we're in the middle of an encounter.
            if(encounter.state != EncounterManager.NO_ENCOUNTER) {
                return;
            }
            // Don't process input if there's something being displayed right now.
            if(PendingOverlay()) {
                return;
            }
            if(this.showCharacter) {
                return;
            }
            if(this.showInventory) {
                return;
            }
            let obj = physics.getObject(this.playerId);

            if(input.isKeyDown('KeyS')) {
                Matter.Body.applyForce(obj, {
                    x: obj.position.x,
                    y: obj.position.y
                }, {x: -Player.MOVEMENT_RATE, y: 0});
            }
            if(input.isKeyDown('KeyW')) {
                Matter.Body.applyForce(obj, {
                    x: obj.position.x,
                    y: obj.position.y
                }, {x: Player.MOVEMENT_RATE, y: 0});
            }
            if(input.isKeyDown('KeyA')) {
                Matter.Body.applyForce(obj, {
                    x: obj.position.x,
                    y: obj.position.y
                }, {x: 0, y: Player.MOVEMENT_RATE});
            }
            if(input.isKeyDown('KeyD')) {
                Matter.Body.applyForce(obj, {
                    x: obj.position.x,
                    y: obj.position.y
                }, {x: 0, y: -Player.MOVEMENT_RATE});
            }
        });
    }

    create() {
        let floor = GetFloorMap();
        let entry = floor.getEntry();

        this.position[0] = entry[0];
        this.position[1] = entry[1];
        this.createPhysicsObject();
    }

    renderInit(scene) {
        console.log("[player] Initializing render objects.");
        if(this.needsCreation) {
            this.needsCreation = false;
            this.create();
        }
        this.playerGeometry = new THREE.SphereGeometry(0.2, 20, 20);
        this.playerMaterial = new THREE.MeshBasicMaterial({color: 0x00ff00});
        this.playerMesh = new THREE.Mesh(this.playerGeometry, this.playerMaterial);
        this.rootNode = new THREE.Object3D();
        this.rootNode.add(this.playerMesh);
        scene.add(this.rootNode);
    }

    render(scene) {
        if(this.needsRenderInit) {
            this.needsRenderInit = false;
            this.renderInit(scene);
        }

        let input = GetInputManager();
        let physics = GetPhysicsManager();
        let obj = physics.getObject(this.playerId);
        this.traveled += (this.distance(this.position, [obj.position.y, obj.position.x])) / 100;
        this.position[0] = obj.position.y;
        this.position[1] = obj.position.x;
        let cameraDistance = 18 + (12 * input.getScroll());
        GetRenderManager().getCamera().lookAt(this.playerMesh.position);
        GetRenderManager().getCamera().position.set(this.playerMesh.position.x , this.playerMesh.position.y + cameraDistance, this.playerMesh.position.z - cameraDistance);
        this.playerMesh.position.x = this.position[0];
        this.playerMesh.position.y = 0;
        this.playerMesh.position.z = this.position[1];
        let floor = GetFloorMap();
        floor.updateShroud([obj.position.y, obj.position.x]);

        let encounter = GetEncounterManager();

        // Don't process input if we're in the middle of an encounter.
        if(encounter.state != EncounterManager.NO_ENCOUNTER) {
            return;
        }
        // Don't process input if there's something being displayed right now.
        if(PendingOverlay()) {
            return;
        }
        if(input.isKeyDown('Space')) {
            floor.interact(this);
        } 
        else if(input.isKeyDown('KeyC') && ((window.performance.now() - this.toggled['c']) / 1000.0) > Player.MAX_TOGGLE_RATE) {
            this.toggled['c'] = window.performance.now();
            if(!this.showCharacter) {
                this.showCharacter = true;
                this.character();
            }
            else {
                this.showCharacter = false;
                ForceHideOverlay();
            } 
            
        } 
        else if(input.isKeyDown('KeyI') && ((window.performance.now() - this.toggled['i']) / 1000.0) > Player.MAX_TOGGLE_RATE) {
            this.toggled['i'] = window.performance.now();
            if(!this.showInventory) {
                this.showInventory = true;
                this.inventory();
            }
            else {
                this.showInventory = false;
                ForceHideOverlay();
            }
        }

    }

    inventory() {
        let audio = GetAudioManager();
        console.log("[player] Showing inventory sheet.");
        var output = `
        <div class='inventory'>
            <div class='inventory-title'>Inventory &nbsp;&nbsp; <a id='close-button'>X</a></div>
            <hr />
            <table class='inventory-table'>
                <tr>
                    <th>Item Name</th>
                    <th>Quantity</th>
                </tr>
        `;
        for(const key in this.items) {
            const tmp = Mustache.render(`
                <tr>
                    <td>{{name}}</td>
                    <td>{{quantity}}</td>
                </tr>
            `, this.items[key]);
            output += tmp;
        }

        output += "</table></div>";
        ForceShowOverlay(output);

        document.getElementById('close-button').addEventListener('click', () => {
            audio.playSound("Selection");
            console.log("[player] Hiding inventory.");
            this.toggled['i'] = window.performance.now();
            this.showInventory = false;
            ForceHideOverlay();
        }, false);
    }

    character() {
        let audio = GetAudioManager();
        this.traveledShort = Math.round(this.traveled * 100) / 100.0;
        console.log("[player] Showing character sheet.");
        const output = Mustache.render(`
            <div class='character'>
                <div class='character-title'>Character Sheet &nbsp;&nbsp; <a id='close-button'>X</a></div>
                <div class='character-name'>{{name}}</div>
                <div class='character-stats'>Explored {{traveledShort}} km so far</div>
                <div class='character-level'>Level {{level}}</div>
                <div class='character-experience'>Experience: {{experience}} xp</div>
                <div class='character-stats'>Cohesion (HP): {{cohesion}} / {{cohesionMax}}</div>
                <div class='character-stats'>Force: {{force}}</div>
                <div class='character-stats'>Affinity: {{affinity}}</div>
            </div>`, this);
        ForceShowOverlay(output);

        document.getElementById('close-button').addEventListener('click', () => {
            audio.playSound("Selection");
            console.log("[player] Hiding character sheet.");
            this.toggled['c'] = window.performance.now();
            this.showCharacter = false;
            ForceHideOverlay();
        }, false);
    }
};

let player = new Player();

function GetPlayer() {
    return player;
}

export {GetPlayer}
