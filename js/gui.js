'use strict';
// html layout (CSS) exists. Here behaviour added
function MetroGUI () {
	var THIS = this; 
	
	// private b/c of special setters, gui
	var beatsPerBar, beatUnit, tempo, gain;
	var barViewHidden, pendulumHidden;
	
	var metro = { // dummy (proxy) for (active) controls
		isPlaying: false, 
		play: function(){ this.isPlaying = true }, stop: function(){ this.isPlaying = false }
	
	};
	
// 	var inited = false; // hasMetro ?
	var subscriptions = [];
	
	var beatsPerBarObj = {
		values: [
			1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23 
		]
	};
	var beatUnitObj = {
		labels: [ '1', '1 / 2', '1 / 4', '1 / 8', '1 / 16', '1 / 32'  ] 
	};
	// hmm, pattern useful for input type number newer iOS
	var tempoSpec /* = { min: 10, max: 400, step: 1, pattern: "[0-9]*" } */ ;
	var gainSpec /* = {  min: 0, max: 1, step: "any", numStep: 0.01 } */ ;
	// minval, maxval, warp, step, defval, units
	tempoSpec = new ControlSpec(10, 400, 'lin',  1);
	tempoSpec.pattern = '[0-9]'; // not used currently, find out ...
	gainSpec = new ControlSpec(0, 1, 'amp', 0); // not numStep, set round on ez obj
	
	
	// html elements ////////////////////////////////////////
	var playCtl = document.getElementById('playCtl');
	var beatsPerBarCtl = document.getElementById('beatsPerBarCtl');
	var beatUnitCtl = document.getElementById('beatUnitCtl');
	var tempoSliderCtl = document.getElementById('tempoSliderCtl'); // => ez
	var tempoNumCtl = document.getElementById('tempoNumCtl'); // => ez
	var gainSliderCtl = document.getElementById('gainSliderCtl'); // => ez
	var gainNumCtl = document.getElementById('gainNumCtl'); // => ez
	
	var barView = document.getElementById('barView'); // a canvas, no, a div here
	
	var beatBoxGroup = document.getElementById('beatBoxGroup'); // SVG
	var currentBeatInBarBox = document.getElementById('currentBeatInBarBox'); // SVG
	
	var wideDisplaysContainer = document.getElementById('wideDisplaysContainer'); // parent
	
	var pendulumContainer = document.getElementById('pendulumContainer');
	var pendulumSwing = document.getElementById('pendulumSwing');
	var pendulumHit = document.getElementById('pendulumHit');
	var pendulumHit2 = document.getElementById('pendulumHit2');
	var pendulumSwitch = document.getElementById('pendulumSwitch');
	
	var postView = document.getElementById('postView'); // again ...
	
	// had put extra key value 'pattern'. How to use it ?
	var tempoEZ = new EZbehaviour(tempoSpec, tempoNumCtl, tempoSliderCtl);
	var gainEZ = new EZbehaviour(gainSpec, gainNumCtl, gainSliderCtl);
	gainEZ.round = 0.01;
	
	
	beatsPerBarObj.labels = beatsPerBarObj.values;
	beatsPerBarObj.len = beatsPerBarObj.values.length;
	for(var i = 0; i < beatsPerBarObj.len; i++){
		var o = document.createElement('option');
		o.textContent = beatsPerBarObj.labels[i];
		beatsPerBarCtl.add(o);
	};

	beatUnitObj.values = beatUnitObj.labels.map(function(item, i){
		return eval(item);
	});
	beatUnitObj.len = beatUnitObj.labels.length;
	for(var i = 0; i < beatUnitObj.len; i++){
		var o = document.createElement('option');
		o.textContent = beatUnitObj.labels[i];
		beatUnitCtl.add(o);
	};
	////////////////////////////////////////////////////////

	
// 	function togglePlay(ev){
// 		var str = metro.play(); // metronome.js
// 		playCtl.textContent = str; // that was practical
// 	}
	
	function togglePlay(ev){
		var str;
		if (metro.isPlaying) {
			metro.stop(); 
			str = "play";
		} else {
			metro.play();
			str = "stop";
		}
		playCtl.textContent = str; 
	}
	
	// set the model ////////
	
	function setNextBeatsPerBar(n) { // test, constrain ?
		metro.nextBeatsPerBar = n;
		beatsPerBarCtl.classList.add('notYet');
	}
	function setNextBeatUnit(x) {
		metro.nextBeatUnit = x;
		beatUnitCtl.classList.add('notYet');
	}
	// hmm, now need the simple case too
	function setBeatsPerBar(n) { // test, constrain ?
		metro.beatsPerBar = n;
	}
	function setBeatUnit(x) {
		metro.beatUnit = x;
	}	
	
	
	////// to next 5 (6) could be delegated my (not yet) own beatsPerBar etc. setters, take val as arg  //////////
	// for manual gui-only testing as well as updating automatically from metro (status quo)
	
	// indexOf tests for strict equality
	// hmm, beatsPerBar, beatUnit no setters b/c nextX preference !
	function updBeatsPerBarGUI(){
		beatsPerBarCtl.selectedIndex = beatsPerBarObj.values.indexOf(beatsPerBar);
		beatsPerBarCtl.classList.remove('notYet');		
	}
	function updBeatUnitGUI(){		
		beatUnitCtl.selectedIndex = beatUnitObj.values.indexOf(beatUnit);
		beatUnitCtl.classList.remove('notYet');
	}
	function updTempoEZ(){
		tempoEZ.value = tempo; // value now passive, have also valueAction setter
	}
	function updGainEZ(){
		gainEZ.value = gain;
	}
	
	
	function updBarView() {
		// viewBox="0 0 49 4"
		var scale = 49 / (beatsPerBar * 2 - 1); 		
		beatBoxGroup.setAttribute("transform", "scale(" + scale + ", 1)");
	}	
			
	function updCurrentBeatInBarView(currentBeatInBar){
		var x = currentBeatInBar * 2;
		currentBeatInBarBox.setAttribute("transform", "translate(" + x + ", 0)");
	}
	
	
	/* needed at all ? */
	function resetPendulum() {
		pendulumSwing.setAttribute(
			'style', // to the left !			
			'-moz-transform: translateX(0); -webkit-transform: translateX(0); transform: translateX(0); '
		);
	}
	
	// or, can I write the duration into the classes until it's changed again ?!
	function durString(dur){
		var str = "-moz-animation-duration: " + dur + "s; -webkit-animation-duration: " + dur + "s; animation-duration: " + dur + "s";
		return str;
	}
	
		// reverse swing didn't work (?), ah, it probably needs the new name to trigger anew, same name ani already ended
		// set class now for animation-name	
	
	// 'beatDur' from context metronome.js (function 'nextBeat')
	function animatePendulum (currentBeats, beatDur) {
		var currentBeatsEven = currentBeats % 2 == 0;
		var pscl = pendulumSwing.classList;
		var phcl = pendulumHit.classList;
		var ph2cl = pendulumHit2.classList;
				
		if (currentBeatsEven) {
			pscl.remove('swingBack');
			pscl.add('swing');
			ph2cl.remove('hit');
			phcl.add('hit');
			pendulumHit.setAttribute('style', durString(beatDur));
		} else {
			pscl.remove('swing');
			pscl.add('swingBack');
			phcl.remove('hit');
			ph2cl.add('hit');
			pendulumHit2.setAttribute('style', durString(beatDur));
		};
		
		pendulumSwing.setAttribute('style', durString(beatDur));
	}
	
	function hideBarView(){
		barView.classList.add('hidden'); // test ? can add twice ?
		barViewSwitch.textContent = "show ...";
		barViewHidden = true;
	}
	function showBarView(){
		barView.classList.remove('hidden');
		barViewSwitch.textContent = "hide ...";
		barViewHidden = false;
	}
	
	function hidePendulum(){
		[ pendulumSwing, pendulumHit, pendulumHit2].forEach(function(item, i){
			item.classList.add('hidden');
		});
		pendulumSwitch.textContent = "show <-->";
		pendulumHidden= true;
	}
	function showPendulum(){		
		[ pendulumSwing, pendulumHit, pendulumHit2] .forEach(function(item, i){
			item.classList.remove('hidden');
		});
		pendulumSwitch.textContent = "hide <-->";
		pendulumHidden= false;
	}
	
	// gui controls actions (now not only to metro, but self too) ////
	
	// would be nice to have button w/ states like SC
	playCtl.addEventListener('click', togglePlay, false); // touch ? click ev received iOS
	
	
	// aahh, currently no own nextBeat...
	beatsPerBarCtl.addEventListener('change', function(ev){
		var ix = this.selectedIndex;
		beatsPerBar = beatsPerBarObj.values[ix];
		if (metro.isPlaying) { setNextBeatsPerBar(beatsPerBar); } else {
			setBeatsPerBar(beatsPerBar);
			updBarView();
		};
	}, false);

	// Firefox special
	beatsPerBarCtl.addEventListener('keyup', function(ev){
		if (ev.key == "ArrowDown" || ev.key == "ArrowUp" || ev.key == "ArrowLeft" || ev.key == "ArrowRight" ) {
// 			console.log(ev.key);
			var ix = this.selectedIndex;
			beatsPerBar = beatsPerBarObj.values[ix];
			if (metro.isPlaying) { setNextBeatsPerBar(beatsPerBar); } else { setBeatsPerBar(beatsPerBar);  };
		}
	}, false);
	
	beatUnitCtl.addEventListener('change', function(ev){
		var ix = this.selectedIndex;
		beatUnit = beatUnitObj.values[ix];
		if (metro.isPlaying) { setNextBeatUnit(beatUnit); } else { setBeatUnit(beatUnit);  };
	}, false);
	
	tempoEZ.action = function(ez){
		tempo = ez.value;
		metro.tempo = tempo;
	}
	gainEZ.action = function(ez){
		gain = ez.value;
		metro.gain = gain;
	}
	
// 	beatsPerBarCtl.addEventListener('change', function(ev){
// 		var ix = this.selectedIndex;
// 		var val = beatsPerBarObj.values[ix];
// 		if (metro.isPlaying) { setNextBeatsPerBar(val); } else {
// 			setBeatsPerBar(val);
// 			updBarView();
// 		};
// 	}, false);
// 
// 	// Firefox special
// 	beatsPerBarCtl.addEventListener('keyup', function(ev){
// 		if (ev.key == "ArrowDown" || ev.key == "ArrowUp" || ev.key == "ArrowLeft" || ev.key == "ArrowRight" ) {
// // 			console.log(ev.key);
// 			var ix = this.selectedIndex;
// 			var val = beatsPerBarObj.values[ix];
// 			if (metro.isPlaying) { setNextBeatsPerBar(val); } else { setBeatsPerBar(val);  };
// 		}
// 	}, false);
// 	
// 	beatUnitCtl.addEventListener('change', function(ev){
// 		var ix = this.selectedIndex;
// 		var val = beatUnitObj.values[ix];
// 		if (metro.isPlaying) { setNextBeatUnit(val); } else { setBeatUnit(val);  };
// 	}, false);
// 	
// 	tempoEZ.action = function(ez){
// 		metro.tempo = ez.value;
// 	}
// 	gainEZ.action = function(ez){
// 		metro.gain = ez.value;
// 	}
	
	/////////////////////////////////////////////////////////////////////////////////////
	
	barViewSwitch.addEventListener('click', function(ev){
		barViewHidden ? showBarView() : hideBarView();
	}, false);
	pendulumSwitch.addEventListener('click', function(ev){
		pendulumHidden ? showPendulum() : hidePendulum();
	}, false);	
	
	

			
	function urlLocal(url) {
		var m = url.match(/192\.168\.0\./);
		if (m) { // not null
			return true; } else { return false; };
	}
	
	if (urlLocal(document.URL)){
		document.title = document.title.replace("testing", "LOCAL");
	};	
	
	
	function drawBeatHook (currentBeatInBar, currentBeats, beatDur){		
		
// 		console.log("drawBeatHook as defined in gui.js");
		
		updCurrentBeatInBarView(currentBeatInBar);
		if (! pendulumHidden) { animatePendulum(currentBeats, beatDur); };
	};	
	
	
	
	// now, with setState different
// 	function init(){	
// 		if (! inited){
// 		
// 			updBeatsPerBarGUI();
// 			updBeatUnitGUI();
// 			updTempoEZ();
// 			updGainEZ();
// // 			updBarView();
// // 	
// // 			if (! barViewHidden){ showBarView() } else { hideBarView() };
// // 			if (! pendulumHidden){ showPendulum() } else { hidePendulum() };
// // 		
// 
// // 		
// 
// 			inited = true;
// 	} else {
// 		console.log(this + " already inited");
// 	}
// 	} // init
	
	
// 	var testSubscriber = function( topics , data ){
// 			console.log("testSubscriber" , topics, data );
// 	};
	var testSubscriber = function(){
			console.log("testSubscriber" , arguments );
	};
	

	
	/////////////////////////////////////////////////////////
	
	Object.defineProperties(this, {
// 		'init': { value: init, enumerable: true }, 
		
		'getState': {
			value: function() { return {
				beatsPerBar: beatsPerBar, beatUnit: beatUnit, tempo: tempo, gain: gain, 
				barViewHidden: barViewHidden, pendulumHidden: pendulumHidden
			}}, 
			enumerable: true
		}, 
		'setState': { // metronome setState does some checking, use specs ?!
			value: function(obj) { 
				for(var prop in obj){
					if (this.hasOwnProperty(prop)){
						this[prop] = obj[prop];
					}
				};
				barViewHidden ? hideBarView() : showBarView(); 
				pendulumHidden ? hidePendulum() : showPendulum();
			}, 
			enumerable: true
		}, 
		
		'beatsPerBar': {
			get: function() { return beatsPerBar }, 
			set: function(n) {
				beatsPerBar = n;
				updBeatsPerBarGUI();
				updBarView();
			}, 
			enumerable: true
		},
		'beatUnit': {
			get: function() { return beatUnit }, 
			set: function(n) {
				beatUnit = n;
				updBeatUnitGUI();
			}, 
			enumerable: true
		},
		'tempo': {
			get: function() { return tempo }, 
			set: function(n) {
				tempo = n;
				updTempoEZ();
			}, 
			enumerable: true
		},
		'gain': {
			get: function() { return gain }, 
			set: function(q) {
				gain = q;
				updGainEZ();
			}, 
			enumerable: true
		},
		
		'hideBarView': { value: hideBarView, enumerable: true }, 
		'showBarView': { value: showBarView, enumerable: true }, 
		'hidePendulum': { value: hidePendulum, enumerable: true }, 
		'showPendulum': { value: showPendulum, enumerable: true }, 
		
		// hide somehow following 2 ? user set not useful
		'barViewHidden': {
			get: function() { return barViewHidden }, 
			set: function(bool) { barViewHidden = bool }, 
			enumerable: true
		}, 
		'pendulumHidden': {
			get: function() { return pendulumHidden }, 
			set: function(bool) { pendulumHidden = bool }, 
			enumerable: true
		},
		
		'metro': {
			get: function() { return metro }, 
			set: function(aMetro) {
				var mState;
				metro = aMetro;				
	[
	// 	pubsubz.subscribe('start', resetPendulum),
		pubsubz.subscribe('stop', resetPendulum), 
		
		pubsubz.subscribe('beatsPerBar', function(topic, args){ // only one arg
			THIS.beatsPerBar = arguments[1];
		}), 
		pubsubz.subscribe('beatUnit', function(){
			THIS.beatUnit = arguments[1];
		}), 
		pubsubz.subscribe('tempo', function(){
			THIS.tempo = arguments[1];
		}), 
		pubsubz.subscribe('gain', function(){
			THIS.gain = arguments[1];
		}), 

	// maybe for special gui update? both nextX questionable anyway, more flexible later ...
		pubsubz.subscribe('nextBeatsPerBar', testSubscriber), 
		pubsubz.subscribe('nextBeatUnit', testSubscriber), 
	
		pubsubz.subscribe('audioContext_statechange', testSubscriber)
	] .forEach(function(item, i){
		subscriptions.push(item)
	});
				
				metro.drawBeatHook = drawBeatHook;
			}, 
			enumerable: true
		}
	});
}

// MetroGUI.prototype = commonInterface;
