'use strict';

// will this here be a mediator ?

var theMetro = new WebAudio_Metro();
var theGUI = new MetroGUI();

var storage = window.localStorage; // storage per origin
var key = 'metro_gui_swit-ch';

var presets = { 
	deflt: { // keep redundancy for now ...
		metro: { beatsPerBar: 4, beatUnit: 1 / 4, tempo: 120, gain: 0.1 }, 
		gui: { beatsPerBar: 4, beatUnit: 1 / 4, tempo: 120, gain: 0.1, barViewHidden: false, pendulumHidden: false }
	}
};

var writeCurrentStates, readStates; 

if (storage) {
	if (! storage.getItem(key)){ storage.setItem(key, JSON.stringify({})) };	
	
	writeCurrentStates = function(name){
		var root = JSON.parse(storage.getItem(key));
		var obj = {};
		obj.metro = theMetro.getState(); 
		obj.gui = theGUI.getState();
		root[name] = obj;
		storage.setItem(key, JSON.stringify(root));
	}
	
	readStates = function(name){
		var root = JSON.parse(storage.getItem(key));
		var obj = root[name];
		if (! obj) { obj = presets.deflt; };
		theMetro.setState(obj.metro);
		theGUI.setState(obj.gui);
	}
	
	window.addEventListener('unload', function(ev) {
		writeCurrentStates('latest');
	});
	window.addEventListener('load', function(ev) {
		readStates('latest'); // init
	});
}{
	theMetro.setState(presets.deflt.metro);
	theGUI.setState(presets.deflt.gui);
};


theMetro.init(); // audio, worker
theGUI.metro = theMetro;

