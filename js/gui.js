'use strict';
// many variables declared in metronome.js, some defined w/ storage.js
// here event listeners added, scripts at bottom of html body, no load event
function makeMetroGUI (metro, storedState) {
	var barViewContext2D; 
	
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
	
	var wideDisplayWidth, wideDisplayHeight;  // computed, so can change css independently

	// html elements
	var playCtl = document.getElementById('playCtl');
	var beatsPerBarCtl = document.getElementById('beatsPerBarCtl');
	var beatUnitCtl = document.getElementById('beatUnitCtl');
	var tempoSliderCtl = document.getElementById('tempoSliderCtl');
	var tempoNumCtl = document.getElementById('tempoNumCtl');
	var gainSliderCtl = document.getElementById('gainSliderCtl');
	var gainNumCtl = document.getElementById('gainNumCtl');
	var barView = document.getElementById('barView'); // a canvas
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
	
	
	
	
	
	// hmm, length of barView and pendulumContainer the same ....
	// pendulum itself and 2 hits are squares

	// string incl "px" -- init()
	function getWideDisplayLengths(){ // hit length equals height of its container
		var s = window.getComputedStyle(barView); // css in EM
		wideDisplayWidth = s.width;
		wideDisplayHeight = s.height;
	}
	// old 'setBarView' also window.scrollTo(0, 0); // onorientationchange
	function setBarViewSize(){
		barView.width = parseInt(wideDisplayWidth); // draw func w/ "intrinsic" view, height 
		barView.height = parseInt(wideDisplayHeight);
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
		pendulumSwitch.textContent = "show Pendulum";
	}
	function showPendulum(){		
		[ pendulumSwing, pendulumHit, pendulumHit2] .forEach(function(item, i){
			item.classList.remove('hidden');
		});
		pendulumSwitch.textContent = "hide Pendulum";
	}

	playCtl.addEventListener('click', togglePlay, false); // touch ? click ev received iOS

	
	beatsPerBarCtl.addEventListener('change', function(ev){
		var ix = this.selectedIndex;
		var val = beatsPerBarObj.values[ix];
		if (metro.isPlaying) { setNextBeatsPerBar(val); } else { setBeatsPerBar(val);  };
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
	
	
	// iOS ? No!
// 	[ tempoSliderCtl, gainSliderCtl ].forEach(function(item, i){
// 		item.addEventListener('touchstart', function(ev) { ev.preventDefault(); }, false);
// 		item.addEventListener('touchmove', function(ev) { ev.preventDefault(); }, false);
// 	});

	
	
	

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
	
	function drawBarView(currentBeatInBar){
		var beatsPerBar = metro.beatsPerBar;
		var x = barView.width / (beatsPerBar * 2 - 1);
		barViewContext2D.clearRect(0, 0, barView.width, barView.height); 
		for (var i = 0; i < beatsPerBar; i++) {
			var test = Math.round(Math.random() * 200) + 55;
			test = "rgb(100, " + test + ", 100)";
		
			barViewContext2D.fillStyle = ( currentBeatInBar == i ) ? 
				((currentBeatInBar === 0) ? test : "#abf") : "#ddd";
			barViewContext2D.fillRect( x * i * 2, 0, x, parseInt(wideDisplayHeight) );
		}
	}
	
	function transString(dur, x) {
			return "-moz-transition-duration: " + dur + "s; -webkit-transition-duration: " + dur + "s; transition-duration: " + dur + "s; " + 			
			"-moz-transform: translateX(" + x + "); -webkit-transform: translateX(" + x + "); transform: translateX(" + x + "); "
	}
	function setAniString(dur){
		return "-moz-animation: opa " + dur + "s cubic-bezier(0, 0.62, 0.36, 1); " +
			"-webkit-animation: opa " + dur + "s cubic-bezier(0, 0.62, 0.36, 1); " +
			"animation: opa " + dur + "s cubic-bezier(0, 0.62, 0.36, 1); "
	}
	
	// 'beatDur' from context metronome.js (function 'nextNote')
	function animatePendulum (currentBeats, beatDur) {
		var currentBeatsEven = currentBeats % 2 == 0;
		var pendulumSwingX = currentBeatsEven ? ((parseInt(wideDisplayWidth) - parseInt(wideDisplayHeight)) + "px") : 0;
		var unsetAni = '-moz-animation-name: none; -webkit-animation-name: none; animation-name: none';
// 		console.log("animatePendulum currentBeats : " + currentBeats + " " + currentBeatsEven);
		
// 		console.log(transString(beatDur, pendulumSwingX));
		
		pendulumSwing.setAttribute(
			'style', transString(beatDur, pendulumSwingX)
		);
			
		if (currentBeatsEven) {
			pendulumHit.setAttribute('style', setAniString(beatDur));
			pendulumHit2.setAttribute('style', unsetAni);
		} else {
			pendulumHit.setAttribute('style', unsetAni);
			pendulumHit2.setAttribute('style', setAniString(beatDur));
		};
	}
	
	function urlLocal(url) {
		var m = url.match(/192\.168\.0\./);
		if (m) { // not null
			return true; } else { return false; };
	}
	

	function init(){
		barViewContext2D = barView.getContext( '2d' );
	
		updBeatsPerBarGUI();
		updBeatUnitGUI();
	
		updTempoNumCtl();
		updTempoCtl();
		updGainNumCtl();
		updGainSliderCtl();
	
		getWideDisplayLengths();
		setBarViewSize();
	
		if (! barViewHidden){ showBarView() } else { hideBarView() };
		if (! pendulumHidden){ showPendulum() } else { hidePendulum() };
		
		if(urlLocal(document.URL)){
			document.title = document.title.replace("testing", "LOCAL");
		};
	}
	
	pubsubz.subscribe('beatsPerBar', updBeatsPerBarGUI);
	pubsubz.subscribe('beatUnit', updBeatUnitGUI);
// 	pubsubz.subscribe('start', resetPendulum);
	pubsubz.subscribe('stop', resetPendulum);
	
	metro.drawBeatHook = function(currentBeatInBar, currentBeats, beatDur){
		if (! barViewHidden) { drawBarView(currentBeatInBar); };
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