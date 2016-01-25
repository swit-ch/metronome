'use strict';
// many variables declared in metronome.js, some defined w/ storage.js
// here event listeners added, scripts at bottom of html body, no load event
function makeMetroGUI (metro, storedState) {
	
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
	var tempoSpec = { min: 10, max: 400, step: 1, pattern: "[0-9]*" };
	var gainSpec = {  min: 0, max: 1, step: "any", numStep: 0.01 };
	
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

	function prepInputCtl(ctl, spec){
		ctl.min = spec.min;
		ctl.max = spec.max;
		ctl.step = spec.step;
		if (spec.numStep && (ctl.type == "number")){
			ctl.step = spec.numStep;
		};
		if (spec.pattern && (ctl.type == "range")){
			ctl.pattern = spec.pattern;
		};
	}
	prepInputCtl(tempoNumCtl, tempoSpec);
	prepInputCtl(tempoSliderCtl, tempoSpec);
	prepInputCtl(gainNumCtl, gainSpec);
	prepInputCtl(gainSliderCtl, gainSpec);

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

	function updTempoNumCtl(){
		tempoNumCtl.value = metro.tempo;
	}
	function updTempoCtl(){
		tempoSliderCtl.value = metro.tempo;
	}
	function updGainNumCtl(){
		gainNumCtl.value = Math.round(metro.gain * 100) / 100;
	}
	function updGainSliderCtl(){
		gainSliderCtl.value = metro.gain;
	}

	function resetPendulum() {
		pendulumSwing.setAttribute(
			'style', // to the left !			
			'-moz-transform: translateX(0); -webkit-transform: translateX(0); transform: translateX(0); '
		);
		pendulumHit.classList.remove('otherHit');
	}

	function hideBarView(){
		barView.classList.add('hidden');
		barViewSwitch.textContent = "show BarView";
	}
	function showBarView(){
		barView.classList.remove('hidden');
		barViewSwitch.textContent = "hide BarView";
	}
	
	function hidePendulum(){
		[ pendulumSwing, pendulumHit, pendulumHit2].forEach(function(item, i){
			item.classList.add('hidden');
		});
		pendulumSwitch.textContent = "show Pendul.";
	}
	function showPendulum(){		
		[ pendulumSwing, pendulumHit, pendulumHit2] .forEach(function(item, i){
			item.classList.remove('hidden');
		});
		pendulumSwitch.textContent = "hide Pendul.";
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
	
	
	// constrain keyboard input, verify ?
	tempoNumCtl.addEventListener('input', 
	// 'change', 
	function (ev){
		metro.tempo = Number(this.value); // string not number
		updTempoCtl();
	}, false);
	tempoSliderCtl.addEventListener('input', function (ev){
		metro.tempo = Number(this.value);
		updTempoNumCtl();
	}, false);

	gainNumCtl.addEventListener('input', 
	// 'change', 
	function (ev){
		metro.gain = Number(this.value);
		updGainSliderCtl();
	}, false);
	gainSliderCtl.addEventListener('input', function (ev){
		metro.gain = Number(this.value);
		updGainNumCtl();
	}, false);

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
	
	function replaceBarView() {
		var beatsPerBar = metro.beatsPerBar;
		var x = 100 / (beatsPerBar * 2 - 1); // percentage		
		var frag = document.createElement('div');
		frag.classList.add('wideDisplay');
		
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
	function updCurrentBeatInBarView(currentBeatInBar){
		var beatsPerBar = metro.beatsPerBar;
		var kids = barView.childNodes;
		var curBox = kids[currentBeatInBar];
		prevBox.id = 'none';
		curBox.id = 'currentBeatInBarBox';
		prevBox = curBox;
	}
	
	function setHitAniString(dur){
		return "-moz-animation: opa " + dur + "s; -webkit-animation: opa " + dur + "s; animation: opa " + dur + "s; "
	}
	function setSwingAniString(dur){
		return "-moz-animation: swing " + dur + "s; -webkit-animation: swing " + dur + "s; animation: swing " + dur + "s; "
	}
	function setSwingBackAniString(dur){
		return "-moz-animation: swingBack " + dur + "s; -webkit-animation: swingBack " + dur + "s; animation: swingBack " + dur + "s; "
	}
	// reverse didn't work (?)
	
	var unsetHitAni = '-moz-animation-name: none; -webkit-animation-name: none; animation-name: none';
	// 'beatDur' from context metronome.js (function 'nextNote')
	function animatePendulum (currentBeats, beatDur) {
		var currentBeatsEven = currentBeats % 2 == 0;
			
		if (currentBeatsEven) {
			pendulumSwing.setAttribute('style', setSwingAniString(beatDur));
			pendulumHit.setAttribute('style', setHitAniString(beatDur));
			pendulumHit2.setAttribute('style', unsetHitAni);
		} else {
			pendulumSwing.setAttribute('style', setSwingBackAniString(beatDur));
			pendulumHit.setAttribute('style', unsetHitAni);
			pendulumHit2.setAttribute('style', setHitAniString(beatDur));
		};
	}
	
	
	/*
	swingCntnr
	*/
	
	function urlLocal(url) {
		var m = url.match(/192\.168\.0\./);
		if (m) { // not null
			return true; } else { return false; };
	}
	

	function init(){	
		updBeatsPerBarGUI();
		updBeatUnitGUI();
	
		updTempoNumCtl();
		updTempoCtl();
		updGainNumCtl();
		updGainSliderCtl();
	
		replaceBarView();
	
		if (! barViewHidden){ showBarView() } else { hideBarView() };
		if (! pendulumHidden){ showPendulum() } else { hidePendulum() };
		
		if(urlLocal(document.URL)){
			document.title = document.title.replace("testing", "LOCAL");
		};
	}
	
	pubsubz.subscribe('beatsPerBar', function(){
		updBeatsPerBarGUI();
		replaceBarView(); // when playing, but not stopped ...
	});
	pubsubz.subscribe('beatUnit', updBeatUnitGUI);
// 	pubsubz.subscribe('start', resetPendulum);
	pubsubz.subscribe('stop', resetPendulum);
	
	metro.drawBeatHook = function(currentBeatInBar, currentBeats, beatDur){		
		updCurrentBeatInBarView(currentBeatInBar);
		
		if (! pendulumHidden) { animatePendulum(currentBeats, beatDur); };
	};
	
	function getState() {
		return {
			"barViewHidden": barViewHidden, "pendulumHidden": pendulumHidden
		}
	}
	
	return {
		init: init, get state() { return getState() }
	}
}