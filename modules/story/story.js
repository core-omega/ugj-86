import {ShowOverlay} from '/modules/display/show';
import {GetAudioManager} from '/modules/world/audio';

function RunStoryIntro() {
    let audio = GetAudioManager();
    
    audio.playTrack('Intro');
    ShowOverlay("", 2.0);
    ShowOverlay("<span class='game-title'><span class='sewer-title'>Sewer</span> Quest</span>", 15.0);
    ShowOverlay("One day, you were crossing the street at a crosswalk.  It was dark, and you were really into reading something on your phone.", 8.0);
    ShowOverlay("You failed to notice a pair of <span style='color:orange'>orange cones</span> surrounding an open manhole cover.  You fell into the sewer.", 8.0);
    ShowOverlay("<span style='color:red'>YOU DIED</span>", 5.0);
    ShowOverlay("Per the Code of Afterlife Regulations, Section 317992, Subsection (J), you are to remain in purgatory at your place of demise.", 8.0);
    ShowOverlay("In this case, that means you are stuck in the local city sewer system for the next few million years or so.  Sucks to be you.", 8.0);
    ShowOverlay("'W', 'A', 'S', 'D' to move.  'Spacebar' to interact.  'C' for character information.  Find and interact with the red squares to move to the next floor.<br /><br />Have fun exploring your new home, friend!", 8.0)
    setTimeout(() => {audio.loopTrack('Adventure');}, 63000);
}

export {RunStoryIntro};