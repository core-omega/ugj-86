import * as THREE from 'three';
import { ShowOverlay } from '/modules/display/show';
import { GetRenderManager } from '/modules/display/render';
import { GetPhysicsManager } from '/modules/physics/physics';
import { GetPlayer } from '/modules/character/player';

class FloorMap {
    static MIN_SEPERATION = 20;
    static DEFAULT_WIDTH = 64;
    static DEFAULT_HEIGHT = 64;

    static TILE_TYPE_WALL = 8;
    static TILE_TYPE_EXIT = 7;
    static TILE_TYPE_ENTRY = 6;
    static TILE_TYPE_FLOOR = 1;

    constructor(gridWidth, gridHeight) {
        this.threeLoader = new THREE.TextureLoader();
        this.destroyed = false;
        this.cloudMap = this.threeLoader.load('/texture/Cloud.png');
        this.width = gridWidth;
        this.height = gridHeight;
        this.map = Array(this.height);  // row, column - not the reverse
        for(var i = 0; i < this.height; ++i) {
            this.map[i] = Array(this.width).fill(FloorMap.TILE_TYPE_WALL);
        }
        this.interactions = [];

        this.entry = this.randomTile();
        this.exit = this.randomTile();
        while(this.distance(this.entry, this.exit) < FloorMap.MIN_SEPERATION) {
            this.exit = this.randomTile();
        }

        this.interactions.push({
            position: this.exit,
            callback: ExitFloor
        });

        this.needsRenderInit = true;
        console.log("[floor] Constructor executed - ready for initialization.");
    }

    randomTile() {
        let x = 1 + Math.floor(Math.random() * (this.width - 3));
        let y = 1 + Math.floor(Math.random() * (this.height - 3)); 

        return [y, x];
    }

    getExit() {
        return this.exit;
    }

    getEntry() {
        return this.entry;
    }

    distance(tile, position) {
        return Math.sqrt(
            ((position[0] - tile[0]) * (position[0] - tile[0])) + 
            ((position[1] - tile[1]) * (position[1] - tile[1])));
    }

    updateShroud(position) {
        let tile = [Math.floor(position[0]), Math.floor(position[1])];
        for(var i = -5; i <= 5; ++i) {
            for(var j = -5; j <= 5; ++j) {
                if(tile[0] + i < 0) {
                    continue;
                }
                if(tile[1] + j < 0) {
                    continue;
                }
                if(tile[0] + i > this.height - 2) {
                    continue;
                }
                if(tile[1] + j > this.width - 2) {
                    continue;
                }
                let targetOpacity = this.distance(position, [tile[0] + i, tile[1] + j]);
                targetOpacity /= 6; 
                this.shroudMesh[tile[0] + i][tile[1] + j].material.opacity = Math.min(
                    this.shroudMesh[tile[0] + i][tile[1] + j].material.opacity,
                    targetOpacity
                );
            }
        }
    }

    destroy(scene) {
        this.wallGeometry.dispose();
        this.shroudGeometry.dispose();
        this.wallMaterial.dispose();
        this.exitMaterial.dispose();
        this.entryMaterial.dispose();
        this.floorMaterial.dispose();
        this.destroyed = true;

        for(var i = 0; i < this.wallMesh.length; ++i) {
            this.rootNode.remove(this.wallMesh[i]);
        }
        this.wallMesh = [];

        for(var i = 0; i < this.height; ++i) {
            for(var j = 0; j < this.width; ++j) {
                this.shroudMesh[i][j].material.dispose();
                this.rootNode.remove(this.shroudMesh[i][j]);
            }
        }

        let physics = GetPhysicsManager();

        physics.clear();
    }

    renderInit(scene) {
        console.log("[floor] Initializing scene graph ...");
        this.rootNode = new THREE.Object3D();


        let baseLightColor = 0xFFFFFF;
        let baseLightIntensity = 0.8;
        this.baseLight = new THREE.DirectionalLight(baseLightColor, baseLightIntensity);
        this.baseLight.position.set(50, 50, 50);
        this.baseLight.target.position.set(100, 0, 50);
        this.rootNode.add(this.baseLight);

        this.wallGeometry = new THREE.BoxGeometry( 1, 1, 1 );
        this.shroudGeometry = new THREE.BoxGeometry( 1, 0.2, 1);
        this.wallMaterial = new THREE.MeshPhongMaterial({ color: 0x223322 });
        this.exitMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
        this.entryMaterial = new THREE.MeshPhongMaterial({ color: 0x0000ff });
        this.floorMaterial = new THREE.MeshPhongMaterial({ color: 0x111111 });
        this.wallMesh = [];
        this.shroudMesh = [];

        for(var i = 0; i < this.height; ++i) {
            this.shroudMesh.push([]);
            for(var j = 0; j < this.width; ++j) {
                let shroudMaterial = new THREE.MeshStandardMaterial({ transparent: true, opacity: 1.0, map: this.cloudMap });
                let mesh = new THREE.Mesh(this.shroudGeometry, shroudMaterial);
                mesh.position.x = i;
                mesh.position.z = j;
                mesh.position.y = 2;
                this.shroudMesh[i].push(mesh);
                this.rootNode.add(mesh);
            }
        }

        for(var i = 0; i < this.height; ++i) {
            for(var j = 0; j < this.width; ++j) {
                if(this.map[i][j] == FloorMap.TILE_TYPE_WALL) {
                    let mesh = new THREE.Mesh( this.wallGeometry, this.wallMaterial );
                    mesh.position.x = i;
                    mesh.position.z = j;
                    this.wallMesh.push(mesh);
                    this.rootNode.add(mesh);
                }
                if(this.map[i][j] == FloorMap.TILE_TYPE_EXIT) {
                    let mesh = new THREE.Mesh( this.wallGeometry, this.exitMaterial );
                    mesh.position.x = i;
                    mesh.position.z = j;
                    mesh.position.y = -1;
                    this.wallMesh.push(mesh);
                    this.rootNode.add(mesh);
                }
                if(this.map[i][j] == FloorMap.TILE_TYPE_ENTRY) {
                    let mesh = new THREE.Mesh( this.wallGeometry, this.entryMaterial );
                    mesh.position.x = i;
                    mesh.position.z = j;
                    mesh.position.y = -1;
                    this.wallMesh.push(mesh);
                    this.rootNode.add(mesh);
                }
                if(this.map[i][j] == FloorMap.TILE_TYPE_FLOOR) {
                    let mesh = new THREE.Mesh( this.wallGeometry, this.floorMaterial );
                    mesh.position.x = i;
                    mesh.position.z = j;
                    mesh.position.y = -1;
                    this.wallMesh.push(mesh);
                    this.rootNode.add(mesh);
                }
            }
        }
        scene.add(this.rootNode);
    }

    render(scene) {
        if(this.destroyed) {
            console.error("Rendering destroyed floor ...");
            console.trace();
            return;
        }
        if(this.needsRenderInit) {
            console.log("[floor] Initializing rendering subsystem.");
            this.needsRenderInit = false;
            this.renderInit(scene);
        }
        
        let player = GetPlayer();
        let available = false;
        for(var i = 0; i < this.interactions.length; ++i) {
            if(player.canInteract(this.interactions[i].position)) {
                available = true;
            }
        }

        if(available) {
            document.getElementById('text-display').innerHTML = "Press spacebar to interact.";
        }
        else {
            document.getElementById('text-display').innerHTML = "";
        }
    }

    interactionsAvailable(player) {
        for(var i = 0; i < this.interactions.length; ++i) {
            if(player.canInteract(this.interactions[i].position)) {
                return true;
            }
        }

        return false;
    }

    interact(player) {
        for(var i = 0; i < this.interactions.length; ++i) {
            if(player.canInteract(this.interactions[i].position)) {
                console.log("[floor] Launching interaction.");
                this.interactions[i].callback();
                return;
            }
        }
    }

    generate() {
        console.log("[floor] " + this.width + "x" + this.height + " tile floor map generation started.");
        let genStart = window.performance.now();

        let exit = this.exit;
        let entry = this.entry;
        console.log("[floor] Entry tile - " + entry[1] + ", " + entry[0]);
        console.log("[floor] Exit tile - " + exit[1] + ", " + exit[0]);
        let current = [];
        current[0] = entry[0];
        current[1] = entry[1];

        let tileQueue = [];
        tileQueue.push(current);

        let carved = 0;

        while(tileQueue.length > 0) {
            current = tileQueue.pop();
            if(this.map[current[0]][current[1]] == FloorMap.TILE_TYPE_FLOOR) {
                continue;
            }
            this.map[current[0]][current[1]] = FloorMap.TILE_TYPE_FLOOR;      // visited ...
            ++carved;

            if(current[0] == exit[0] && current[1] == exit[1]) {
                /* Drain the remaining tiles. */
                while(tileQueue.length > 0) {
                    let tmp = tileQueue.pop();
                    this.map[tmp[0]][tmp[1]] = FloorMap.TILE_TYPE_FLOOR;
                }
                continue;
            }

            let used = [false, false, false, false];   // north, west, south, east
            let weight = [0.2, 0.3, 0.2, 0.3];         // weights for each of the directions
            let allUsed = false;
            while(!allUsed) {
                let roll = Math.random();
                let sum = 0.0;
                let choice = 0;
                while(sum + weight[choice] < roll) {
                    sum += weight[choice];
                    ++choice;
                }
                if(!used[choice]) {
                    used[choice] = true;
                    if(choice == 0) {
                        if(current[0] > 1) {
                            tileQueue.push([current[0] - 1, current[1]]);
                        }
                    } else if(choice == 1) {
                        if(current[1] > 1) {
                            tileQueue.push([current[0], current[1] - 1]);
                        }
                    } else if(choice == 2) {
                        if(current[0] < this.width - 2) {
                            tileQueue.push([current[0] + 1, current[1]]);
                        }
                    } else {
                        if(current[1] < this.height - 2) {
                            tileQueue.push([current[0], current[1] + 1]);
                        }
                    }
                }
                allUsed = true;
                for(var i = 0; i < 4; ++i) {
                    if(used[i] == false) {
                        allUsed = false;
                    }
                }

            }

        }

        this.map[exit[0]][exit[1]] = FloorMap.TILE_TYPE_EXIT;
        this.map[entry[0]][entry[1]] = FloorMap.TILE_TYPE_ENTRY;

        let physics = GetPhysicsManager();

        for(var i = 0; i < this.height; ++i) {
            for(var j = 0; j < this.width; ++j) {
                if(this.map[i][j] == FloorMap.TILE_TYPE_WALL) {
                    physics.addWall(j, i);
                }
            }
        }

        genStart = window.performance.now() - genStart;
        console.log("[floor] " + this.width + "x" + this.height + " tile floor map generation completed in " + genStart + " ms.");
        // console.log(this.map);
    }

}

function ExitFloor() {
    ShowOverlay("Moving to next floor ...", 3);
    GetFloorMap().destroy();
    GenerateFloorMap(mapWidth, mapHeight);
    let render = GetRenderManager();
    render.register('FloorMap', GetFloorMap());
    let player = GetPlayer();
    player.createPhysicsObject();
}

function GenerateFloorMap(mapWidth, mapHeight) {
    map = new FloorMap(mapWidth, mapHeight);
    map.generate();
}

function GetFloorMap() {
    return map;
}

let mapWidth = FloorMap.DEFAULT_WIDTH;
let mapHeight = FloorMap.DEFAULT_HEIGHT;
var map = new FloorMap(mapWidth, mapHeight);

function SetMapWidth(width) {
    mapWidth = width;
}

function SetMapHeight(height) {
    mapHeight = height;
}

export {GenerateFloorMap, GetFloorMap, SetMapWidth, SetMapHeight};
