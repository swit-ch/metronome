'use strict';


/*
var o = getStoredState('latest');      
var m = new WebAudio_Metro(o); 
m.init();
var g = new MetroGUI(o);
g.metro = m; 
g.init();
*/


var presets = {
	huh: {
		beatsPerBar: 5, beatUnit: 1 / 8, tempo: 133, gain: 0.13, 
		barViewHidden: false, pendulumHidden: false
	}, 
	hubba: {
		beatsPerBar: 3, beatUnit: 1 / 2, tempo: 100, gain: 0.099, 
		barViewHidden: true, pendulumHidden: true
	}
};


// var m = new WebAudio_Metro(); 
// var g = new MetroGUI();
// 
// m.setState(presets.hubba); 
// g.setState(presets.hubba); // actually metro part of state ! ah, now set metro sets state too ...
// 
// m.init(); // worker, audio
// g.metro = m; // set side effects, no more init




// gui alone /////////////////
var g = new MetroGUI();
// g.setState(presets.hubba);
/////////////////////////////////


// metro alone /////////////
var m = new WebAudio_Metro();
//m.init(); // assumes some state, error

/*
separate testing, code, doc where? props of constructors ? Tests in browser console 
metro alone 
gui alone (proxy, or maybe a not "inited" metro)
new gui w/ existing metro
new metro to existing gui

(would need destructors? unsubscribe pub sub, what else, audio context, worker)


find out if useful if both could share a common state object (in their constructor's prototypes ...)
?
*/