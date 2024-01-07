import { GenerateFloorMap, GetFloorMap } from '/modules/world/floor';
import { RunStoryIntro } from '/modules/story/story';
import { ForceShowOverlay, ForceHideOverlay } from '/modules/display/show';
import { CreateRenderManager, GetRenderManager } from '/modules/display/render';
import { GetPhysicsManager } from '/modules/physics/physics';
import { GetPlayer } from '/modules/character/player'
import { GetInputManager } from '/modules/world/input';
import { GetAudioManager } from '/modules/world/audio';
import { GetContentLoadingManager} from '/modules/world/loading';
import { GetEncounterManager } from '/modules/world/encounter';

function StartLoading() {
    let audio = GetAudioManager();
    audio.loadTrack('Intro');
    audio.loadTrack('Adventure');
    audio.loadTrack('Encounter');
    audio.loadTrack('Battle');

    let loading = GetContentLoadingManager();
    ForceShowOverlay("Loading assets ...");
    loading.wait(EntryPoint);
}

function EntryPoint() {
    ForceHideOverlay();
    let audio = GetAudioManager();

    // RunStoryIntro();

    GenerateFloorMap(96, 96);
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
