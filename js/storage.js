'use strict';
// no localStorage in Opera mini (but audio a.o. doesn't work there anyway ...)

var storage = window.localStorage; // possibly undefined // storage per origin

// is it safe to get/set via prop name instead of getItem, setItem ?
function readItems(store){ // oh, localStorage values always strings ?!
	var bpb, bu, t, g, nbpb, nbu, bvh, ph;
	
	if (store) { try {
		bpb = store.getItem('beatsPerBar');
		bu = store.getItem('beatUnit');
		t = store.getItem('tempo'); 
		g = store.getItem('gain');
		nbpb = store.getItem('nextBeatsPerBar');
		nbu = store .getItem('nextBeatUnit');
		bvh = store .getItem('barViewHidden');
		ph = store .getItem('pendulumHidden');
	} catch(e){} };
	
	beatsPerBar = bpb ? Number(bpb) : 3;
	beatUnit = bu ? Number(bu) : 1 / 4;
	tempo = t ? Number(t) : 123; 
	gain = g ? Number(g) : 1 / 7; 
	nextBeatsPerBar = nbpb ? Number(nbpb) : 3;
	nextBeatUnit = nbu ? Number(nbu) : 1 / 4;
	barViewHidden = bvh == "true" ? true : false;
	pendulumHidden = ph == "true" ? true : false;
}

function writeItems(store){
	store.setItem('beatsPerBar', beatsPerBar);
	store.setItem('beatUnit', beatUnit);
	store.setItem('tempo', tempo);
	store.setItem('gain', gain);
	store.setItem('nextBeatsPerBar', nextBeatsPerBar);
	store.setItem('nextBeatUnit', nextBeatUnit);
	store.setItem('barViewHidden', barViewHidden);
	store.setItem('pendulumHidden', pendulumHidden);
}
 
// if (storage) { readItems(storage); }; // init -- read anyway for defaults
// readItems(storage);


// arghh, spent much time only to find out 'unload' is supported by Safari mobile unlike 'beforeunload'
if (storage){
	window.addEventListener("unload", function(ev) {
		writeItems(storage);
	}, false);
};