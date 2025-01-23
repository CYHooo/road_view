// golbal parameters file

export let scene; // golbal scene, for update view.js && form.js sence status
export let pointerControls; // update controls status view.js && form.js
export let markers = []; // check golbol info point

/**
 * @param {*} e => param from local
 * @return {*} => Shared Global Parameters
 */
export function setScene(e) {
    scene = e;
}

export function setPointerConctrols(e) {
    pointerControls = e;
}

export function setMarkers(e) {
    markers = e;
}
