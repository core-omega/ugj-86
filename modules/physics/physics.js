class PhysicsManager {
    constructor() {
        this.engine = Matter.Engine.create({render: {visible: false}});
        this.engine.gravity.scale = 0.0;
    }

    addWall(x, y) {
        let wall = Matter.Bodies.rectangle(x, y, 1, 1, {isStatic: true});
        Matter.World.add(this.engine.world, [wall]);
    }

    addDynamicObject(x, y, radius) {
        let obj = Matter.Bodies.circle(x, y, radius, {
            friction: 0.000001,
            restitution: 0.5,
            density: 0.1
        });
        let id = this.engine.world.bodies.length;
        Matter.World.add(this.engine.world, [obj]);
        return id;
    }

    getObject(id) {
        return this.engine.world.bodies[id];
    }

    getEngine() {
        return this.engine;
    }

    start() {
        Matter.Engine.run(this.engine);
    }
}

let physicsManager = new PhysicsManager();

function GetPhysicsManager() {
    return physicsManager;
}

export {GetPhysicsManager}
