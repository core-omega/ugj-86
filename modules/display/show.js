let overlayQueue = [];
let overlayTimes = [];
let isShowing = false;

function PendingOverlay() {
    return (overlayQueue.length != 0);
}

function UpdateOverlay() {
    isShowing = true;
    if(overlayQueue.length == 0) {
        document.getElementById('overlay').style.height = '0';
        overlayQueue = [];
        overlayTimes = [];  
        document.getElementById('overlay-content').innerHTML = '';
        isShowing = false;
        return;
    }

    let nextItem = overlayQueue.shift();
    let nextTime = overlayTimes.shift();

    document.getElementById('overlay').style.height = '100%';
    document.getElementById('overlay-content').innerHTML = nextItem;
    console.log("[overlay] Update via setTimeout(" + nextTime + ");");
    setTimeout(UpdateOverlay, nextTime);
}

function ShowOverlay(text, time) {
    overlayQueue.push(text);
    overlayTimes.push(Math.floor(time * 1000.0));
    if(!isShowing) {
        console.log("[overlay] Triggering overlay update.");
        UpdateOverlay();
    }
}

function ForceShowOverlay(text) {
    document.getElementById('overlay').style.height = '100%';
    document.getElementById('overlay-content').innerHTML = text;
}

function ForceHideOverlay() {
    document.getElementById('overlay').style.height = '0';
    document.getElementById('overlay-content').innerHTML = '';
}

export {ShowOverlay, UpdateOverlay, PendingOverlay, ForceShowOverlay, ForceHideOverlay};
