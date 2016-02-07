'use strict';

var theMetro, theGUI;


var getStoredState = (function(){
	var storage = window.localStorage; // possibly undefined // storage per origin
	var key = 'metro_gui_swit-ch';

	function initStore(store){
		if (! store.getItem(key)) {
			store.setItem(key, JSON.stringify({}));
		}
	}
	function setStore(store, name){
		var obj = {}, parent;
		parent = store.getItem(key);
		parent = JSON.parse(parent);
		obj.metro = theMetro.getState(); 
		obj.gui = theGUI.getState(); 
		parent.name = obj;
		parent = JSON.stringify(parent);
		store.setItem(key, parent);
	}
	function getStore(store, name){
		var parent = store.getItem(key);
		parent = JSON.parse(parent);
		return parent.name;
	}

	initStore(storage);

	if (storage){
		window.addEventListener('unload', function(ev) {
			setStore(storage, 'latest');
		}, false);
	};

	return function (name) {
		return getStore(storage, name);
	};
})()

var presets = {
	huh: {
		beatsPerBar: 5, beatUnit: 1 / 8, tempo: 133, gain: 0.13, 
		barViewHidden: false, pendulumHidden: false
	}, 
	hubba: {
		beatsPerBar: 3, beatUnit: 1 / 2, tempo: 100, gain: 0.099, 
		barViewHidden: true, pendulumHidden: true
	}, 
	sibe: { 
		beatsPerBar: 7, beatUnit: 0.125, tempo: 85, gain: 0.099, 
		barViewHidden: false, pendulumHidden: false 
	}
};

theMetro = new WebAudio_Metro();
theGUI = new MetroGUI();
var theStore = getStoredState('latest');

// theGUI.setState(presets.sibe);
theGUI.setState(theStore.gui);

// theMetro.setState(presets.sibe);
theMetro.setState(theStore.metro);
theMetro.init(); // assumes some state, error
theGUI.metro = theMetro;

