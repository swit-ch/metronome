'use strict';


/*
var o = getStoredState('latest');      
var m = new WebAudio_Metro(o); 
m.init();
var g = new MetroGUI(o);
g.metro = m; 
g.init();
*/


var mSets = {
	huh: {
		beatsPerBar: 5, beatUnit: 1 / 8, tempo: 133, gain: 0.13, 
		barViewHidden: false, pendulumHidden: false
	}, 
	hubba: {
		beatsPerBar: 3, beatUnit: 1 / 2, tempo: 100, gain: 0.99, 
		barViewHidden: true, pendulumHidden: true
	}
};

// gui alone /////////////////
var g = new MetroGUI();
// g.setState(mSets.hubba);
/////////////////////////////////


// metro alone /////////////
// var m = new WebAudio_Metro();



/*
separate testing, code where? (browser console, some templates?)
metro alone 
gui alone (proxy, or maybe a not "inited" metro)
new gui w/ existing metro
new metro to existing gui

(would need destructors? unsubscribe pub sub, what else, audio context, worker)


find out if useful if both could share a common state object in their constructor's prototypes
?
*/