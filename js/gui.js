'use strict';
// html layout (CSS) exists. Here behaviour added
function MetroGUI
( /*metro, */ storedState) {
	
	var metro = null; // gui should work w/o model, EG composite "ez" views, defaults from specs
	// gui could have similar interface like model (beatsPerBar, tempo ... isPlaying)
	
// 	metro = { beatsPerBar: 3, beatUnit: 1 / 3, tempo: 90, gain: 0.1 }; // dummy test (proxy?)
	
	var inited = false;
	
	var barViewHidden = false;
	var pendulumHidden = false;
	var ssg;
	if (storedState){
		if (storedState.gui){
			ssg = storedState.gui;
			if (typeof ssg.barViewHidden == 'boolean') { barViewHidden = ssg.barViewHidden; };
			if (typeof ssg.pendulumHidden == 'boolean') { pendulumHidden = ssg.pendulumHidden; };
		}
	};

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
	
	
	// html elements
	var playCtl = document.getElementById('playCtl');
	var beatsPerBarCtl = document.getElementById('beatsPerBarCtl');
	var beatUnitCtl = document.getElementById('beatUnitCtl');
	var tempoSliderCtl = document.getElementById('tempoSliderCtl');
	var tempoNumCtl = document.getElementById('tempoNumCtl');
	var gainSliderCtl = document.getElementById('gainSliderCtl');
	var gainNumCtl = document.getElementById('gainNumCtl');
	
	var barView = document.getElementById('barView'); // a canvas, no, a div here
	
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
	
	
	function togglePlay(ev){
		var str = metro.play(); // metronome.js
		playCtl.textContent = str;
	}
	
	
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
	
	
	
	// indexOf tests for strict equality
	// hmm, beatsPerBar, beatUnit no setters b/c nextX preference !
	function updBeatsPerBarGUI(){
		// special case: next is set, next bar not reached (?)
		var val = metro.nextBeatsPerBar || metro.beatsPerBar;
		beatsPerBarCtl.selectedIndex = beatsPerBarObj.values.indexOf(val);
		beatsPerBarCtl.classList.remove('notYet');		
	}
	function updBeatUnitGUI(){
		var val = metro.nextBeatUnit || metro.beatUnit;
		beatUnitCtl.selectedIndex = beatUnitObj.values.indexOf(val);
		beatUnitCtl.classList.remove('notYet');
	}
	
	function updTempoEZ(){
		tempoEZ.value = metro.tempo; // value now passive, have also valueAction setter
	}
	function updGainEZ(){
		gainEZ.value = metro.gain;
	}
	
	

	function replaceBarView() {
		var beatsPerBar = metro.beatsPerBar;
		var x = 100 / (beatsPerBar * 2 - 1); // percentage		
		var frag = document.createElement('div');
		frag.classList.add('wideDisplay');
		
		
// 		console.log("replaceBarView called");
		
		for (var i = 0, ele; i < beatsPerBar; i++) {
			ele = document.createElement('span');
			ele.classList.add('barViewBeatBox');
			
			ele.setAttribute('style', 
				"left: " + x * i * 2 + "%; width: " + x + "%;"
			);
			frag.appendChild(ele);
		};
		frag.id = 'barView';
		wideDisplaysContainer.replaceChild(frag, barView);
		barView = frag;
	}	
	
	var prevBox = document.createElement('span');
		
	function updCurrentBeatInBarView(currentBeatInBar, beatDur){
		var beatsPerBar = metro.beatsPerBar;
		var kids = barView.childNodes;
		var curBox = kids[currentBeatInBar];
		prevBox.id = 'none';
		
// 		console.log("updCurrentBeatInBarView currentBeatInBar : " + currentBeatInBar + " curBox: " + curBox); // bug in master !
		
		if (beatsPerBar > 1) { curBox.id = 'currentBeatInBarBox';		}; /* still BUG ! */
		prevBox = curBox;
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
		barView.classList.add('hidden');
		barViewSwitch.textContent = "show ...";
	}
	function showBarView(){
		barView.classList.remove('hidden');
		barViewSwitch.textContent = "hide ...";
	}
	
	function hidePendulum(){
		[ pendulumSwing, pendulumHit, pendulumHit2].forEach(function(item, i){
			item.classList.add('hidden');
		});
		pendulumSwitch.textContent = "show <-->";
	}
	function showPendulum(){		
		[ pendulumSwing, pendulumHit, pendulumHit2] .forEach(function(item, i){
			item.classList.remove('hidden');
		});
		pendulumSwitch.textContent = "hide <-->";
	}

	playCtl.addEventListener('click', togglePlay, false); // touch ? click ev received iOS

	
	beatsPerBarCtl.addEventListener('change', function(ev){
		var ix = this.selectedIndex;
		var val = beatsPerBarObj.values[ix];
		if (metro.isPlaying) { setNextBeatsPerBar(val); } else {
			setBeatsPerBar(val);
			replaceBarView();
		};
	}, false);

	// Firefox special
	beatsPerBarCtl.addEventListener('keyup', function(ev){
		if (ev.key == "ArrowDown" || ev.key == "ArrowUp" || ev.key == "ArrowLeft" || ev.key == "ArrowRight" ) {
// 			console.log(ev.key);
			var ix = this.selectedIndex;
			var val = beatsPerBarObj.values[ix];
			if (metro.isPlaying) { setNextBeatsPerBar(val); } else { setBeatsPerBar(val);  };
		}
	}, false);
	
	beatUnitCtl.addEventListener('change', function(ev){
		var ix = this.selectedIndex;
		var val = beatUnitObj.values[ix];
		if (metro.isPlaying) { setNextBeatUnit(val); } else { setBeatUnit(val);  };
	}, false);
	
	tempoEZ.action = function(ez){
		metro.tempo = ez.value;
	}
	gainEZ.action = function(ez){
		metro.gain = ez.value;
	}
	
	barViewSwitch.addEventListener('click', function(ev){
		if (! barViewHidden){
			barViewHidden = true;
			hideBarView();
		} else {
			barViewHidden = false;
			showBarView();
		}
	}, false);
	pendulumSwitch.addEventListener('click', function(ev){
		if (! pendulumHidden){
			pendulumHidden = true;
			hidePendulum();
		} else {
			pendulumHidden = false;
			showPendulum();
		}
	}, false);
	
			
	function urlLocal(url) {
		var m = url.match(/192\.168\.0\./);
		if (m) { // not null
			return true; } else { return false; };
	}
		
	function init(){	
		if (! inited){
		
			updBeatsPerBarGUI();
			updBeatUnitGUI();
			updTempoEZ();
			updGainEZ();
			replaceBarView();
	
			if (! barViewHidden){ showBarView() } else { hideBarView() };
			if (! pendulumHidden){ showPendulum() } else { hidePendulum() };
		
			if (urlLocal(document.URL)){
				document.title = document.title.replace("testing", "LOCAL");
			};
		
			metro.drawBeatHook = function(currentBeatInBar, currentBeats, beatDur){		
				updCurrentBeatInBarView(currentBeatInBar, beatDur);
				if (! pendulumHidden) { animatePendulum(currentBeats, beatDur); };
			};
			inited = true;
	} else {
		console.log(this + " already inited");
	}
	} // init
	
	
	/// would like to update gui only if changes not caused by gui itself...
	var testSubscriber = function( topics , data ){
			console.log( topics + ": " + data );
	};
	
// 	pubsubz.subscribe('start', resetPendulum);
	pubsubz.subscribe('stop', resetPendulum);	
	
	pubsubz.subscribe('beatsPerBar', function(){
		updBeatsPerBarGUI();
		replaceBarView(); // when playing, but not stopped ...
	});
	pubsubz.subscribe('beatUnit', updBeatUnitGUI);	
	
	pubsubz.subscribe('tempo', updTempoEZ);
	pubsubz.subscribe('gain', updGainEZ);


// maybe pub/sub nextBeatsPerBar etc. (name?) too (special gui update)
	pubsubz.subscribe('nextBeatsPerBar', testSubscriber);
	pubsubz.subscribe('nextBeatUnit', testSubscriber);
	
// 	pubsubz.subscribe('audioContext_statechange', testSubscriber);
	pubsubz.subscribe('audioContext_statechange', function(){
		console.log(arguments);
	});
	/////////////////////////////////////////////////////////
	
	function getState() {
		return {
			"barViewHidden": barViewHidden, "pendulumHidden": pendulumHidden
		}
	}
	
// 	return {
// // 		init: init, 
// 		get state() { return getState() }, 
// 		set metro(m) {
// 			metro = m;
// 			init();
// 		}
// 	}
	Object.defineProperties(this, {
		
		
		'init': { value: init, enumerable: true }, 
		'state': {
			get: function() { return getState() }, 
// 			set: function(obj) { return setState(obj) }, 
			enumerable: true
		}, 
		'metro': {
			get: function() { return metro }, 
			set: function(aMetro) { metro = aMetro }, 
			enumerable: true
		}
	});
}