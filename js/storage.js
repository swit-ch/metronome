'use strict';
// no localStorage in Opera mini (but audio a.o. doesn't work there anyway ...)
var getStoredState = (function(){
	var storage = window.localStorage; // possibly undefined // storage per origin
	var key = 'metro_gui_swit-ch';

	// is it safe to get/set via prop name instead of getItem, setItem ?
	// function readItems(store){ // oh, localStorage values always strings ?!
	// 	var bpb, bu, t, g, nbpb, nbu, bvh, ph;
	// 	
	// 	if (store) { try {
	// 		bpb = store.getItem('beatsPerBar');
	// 		bu = store.getItem('beatUnit');
	// 		t = store.getItem('tempo'); 
	// 		g = store.getItem('gain');
	// 		nbpb = store.getItem('nextBeatsPerBar');
	// 		nbu = store .getItem('nextBeatUnit');
	// 		bvh = store .getItem('barViewHidden');
	// 		ph = store .getItem('pendulumHidden');
	// 	} catch(e){} };
	// 	
	// 	beatsPerBar = bpb ? Number(bpb) : 3;
	// 	beatUnit = bu ? Number(bu) : 1 / 4;
	// 	tempo = t ? Number(t) : 123; 
	// 	gain = g ? Number(g) : 1 / 7; 
	// 	nextBeatsPerBar = nbpb ? Number(nbpb) : 3;
	// 	nextBeatUnit = nbu ? Number(nbu) : 1 / 4;
	// 	// gui.js
	// 	barViewHidden = bvh == "true" ? true : false;
	// 	pendulumHidden = ph == "true" ? true : false;
	// }

	// function writeItems(store){
	// 	store.setItem('beatsPerBar', beatsPerBar);
	// 	store.setItem('beatUnit', beatUnit);
	// 	store.setItem('tempo', tempo);
	// 	store.setItem('gain', gain);
	// 	store.setItem('nextBeatsPerBar', nextBeatsPerBar);
	// 	store.setItem('nextBeatUnit', nextBeatUnit);
	// 	store.setItem('barViewHidden', barViewHidden);
	// 	store.setItem('pendulumHidden', pendulumHidden);
	// }
 
	// if (storage) { readItems(storage); }; // init -- read anyway for defaults
	// readItems(storage);

	function initStore(store){
		if (! store.getItem(key)) {
			store.setItem(key, JSON.stringify({}));
		}
	}
	function setStore(store, name){
		var obj = {}, parent;
		parent = store.getItem(key);
		parent = JSON.parse(parent);
		obj.metro = m.state;
		obj.gui = g.state;
		parent.name = obj;
		parent = JSON.stringify(parent);
		store.setItem(key, parent);
	}
	function getStore(store, name){
		var parent = store.getItem(key);
		parent = JSON.parse(parent);
		return parent.name;
	}

// 	initStore(storage);

	// arghh, spent much time only to find out 'unload' is supported by Safari mobile unlike 'beforeunload'
	if (storage){
		window.addEventListener('unload', function(ev) {
	// 		writeItems(storage);
			setStore(storage, 'latest');
		}, false);
	};

	return function (name) {
		return getStore(storage, name);
	};
})()