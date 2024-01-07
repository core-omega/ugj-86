import { GenerateFloorMap, GetFloorMap } from '/modules/world/floor.js';
import { RunStoryIntro } from '/modules/story/story.js';
import { ForceShowOverlay, ForceHideOverlay } from '/modules/display/show.js';
import { CreateRenderManager, GetRenderManager } from '/modules/display/render.js';
import { GetPhysicsManager } from '/modules/physics/physics.js';
import { GetPlayer } from '/modules/character/player.js'
import { GetInputManager } from '/modules/world/input.js';
import { GetAudioManager } from '/modules/world/audio.js';
import { GetContentLoadingManager} from '/modules/world/loading.js';
import { GetEncounterManager } from '/modules/world/encounter.js';

function StartLoading() {
    let audio = GetAudioManager();
    audio.loadTrack('Intro');
    audio.loadTrack('Adventure');
    audio.loadTrack('Encounter');
    audio.loadTrack('Battle');
    
    audio.loadSound('Selection');

    let loading = GetContentLoadingManager();
    ForceShowOverlay("Loading assets ...");
    loading.wait(EntryPoint);
}

function EntryPoint() {
    ForceHideOverlay();
    let audio = GetAudioManager();

    RunStoryIntro();

    GenerateFloorMap(64, 64);
    GetInputManager().start();

    let physics = GetPhysicsManager();
    physics.start();

    let player = GetPlayer();
    let encounter = GetEncounterManager();

    CreateRenderManager('three-container');
    let render = GetRenderManager();
    render.register('FloorMap', GetFloorMap());
    render.register('Player', player);
    render.register('Encounter', encounter);

    render.start();
}

window.addEventListener('load', () => {
    ForceShowOverlay(" <a id='start-button'>Click here to start the game.</a>");
    document.getElementById('start-button').addEventListener('click', StartLoading, false);
}, false);
