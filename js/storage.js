'use strict';
// no localStorage in Opera mini (but audio a.o. doesn't work there anyway ...)


var storage = window.localStorage; // possibly undefined // storage per origin

// is it safe to get/set via prop name instead of getItem, setItem ?
function readItems(store){ // oh, localStorage values always strings ?!
	var bpb = store.getItem('beatsPerBar');
	var bu = store.getItem('beatUnit');
	var t = store.getItem('tempo'); 
	var g = store.getItem('gain');
	
	var nbpb = store.getItem('nextBeatsPerBar');
	var nbu = store .getItem('nextBeatUnit');
	
	beatsPerBar = bpb ? Number(bpb) : 3;
	beatUnit = bu ? Number(bu) : 1 / 4;
	tempo = t ? Number(t) : 123; 
	gain = g ? Number(g) : 1 / 7; 
	
	nextBeatsPerBar = nbpb ? Number(nbpb) : 3;
	nextBeatUnit = nbu ? Number(nbu) : 1 / 4;
}
function writeItems(store){
	store.setItem('beatsPerBar', beatsPerBar);
	store.setItem('beatUnit', beatUnit);
	store.setItem('tempo', tempo);
	store.setItem('gain', gain);    
					
	store.setItem('nextBeatsPerBar', nextBeatsPerBar);
	store.setItem('nextBeatUnit', nextBeatUnit);
}
 
if (storage) { readItems(storage); }; // init

// arghh, spent much time only to find out 'unload' is supported by Safari mobile unlike 'beforeunload'
if (storage){
	window.addEventListener("unload", function(ev) {
		writeItems(storage);
	}, false);
};