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
	var debugContainer = document.getElementById('debugContainer');
	var trigCtl = document.getElementById('trigCtl');
	var trigCtl1 = document.getElementById('trigCtl1');
	var sizeInfoCtl = document.getElementById('sizeInfoCtl');
	var postView = document.getElementById('postView');

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

	function setBeatsPerBar(n) { // test, constrain ?
	//         beatsPerBar = n;
		metro.nextBeatsPerBar = n;
		beatsPerBarCtl.classList.add('notYet');
	}
	function setBeatUnit(x) {
	//         beatUnit = x;
		metro.nextBeatUnit = x;
		beatUnitCtl.classList.add('notYet');
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
			'-moz-transform: translate(0px, 0px); -webkit-transform: translate(0px, 0px); transform: translate(0px, 0px); '
// 				'-moz-transform: none; -webkit-transform: none; transform: none; '
		);
		pendulumHit.classList.remove('otherHit');
	}

	function hideBarView(){
// 		barView.style.visibility = 'hidden';
		barView.classList.add('hidden');
		barViewSwitch.textContent = "show BarView";
	}
	function showBarView(){
// 		barView.style.visibility = 'visible';
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
		setBeatsPerBar(beatsPerBarObj.values[ix]); // NB: sets nextBeatsPerBar !
	}, false);

	// Firefox special
	beatsPerBarCtl.addEventListener('keyup', function(ev){
		if (ev.key == "ArrowDown" || ev.key == "ArrowUp" || ev.key == "ArrowLeft" || ev.key == "ArrowRight" ) {
// 			console.log(ev.key);
			var ix = this.selectedIndex;
			setBeatsPerBar(beatsPerBarObj.values[ix]);
		}
	}, false);



	// NB: sets nextBeatUnit !
	beatUnitCtl.addEventListener('change', function(ev){
		var ix = this.selectedIndex;
		setBeatUnit(beatUnitObj.values[ix]);
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

	// debug only
	
	// don't have scheduleNote in this context, ATM have metro.audioContext (unused)
// 	trigCtl.addEventListener('click', function (ev){
// 		scheduleNote(0, audioContext.currentTime); // beatNumber, time
// 	}, false);
// 	trigCtl1.addEventListener('click', function (ev){
// 		scheduleNote(1, audioContext.currentTime); // beatNumber, time
// 	}, false);

// 	sizeInfoCtl.addEventListener('click', function (ev) {
// 		var ele = document.createElement('div');
// 		ele.textContent = "innerWidth : " + window.innerWidth + " innerHeight : " + window.innerHeight;
// 		postView.appendChild(ele);
// 	}, false);
// 
// 	// called in init func (on win load) of metronome.js if no audio context etc
// 	function disablePlayCtls(){
// 			playCtl.disabled = true;
// 			trigCtl.disabled = true;
// 			trigCtl1.disabled = true;
// 	}
	
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

	// 'beatDur' from context metronome.js (function 'nextNote')
	function animatePendulum (currentBeats, beatDur) {
		var currentBeatsEven = currentBeats % 2 == 0;
		var pendulumSwingX = currentBeatsEven ? ((parseInt(wideDisplayWidth) - parseInt(wideDisplayHeight)) + "px") : 0;
		
// 		console.log("animatePendulum currentBeats : " + currentBeats + " " +currentBeatsEven);
		
		pendulumSwing.setAttribute(
			'style', 
			"-moz-transition-duration: " + beatDur + "s; -webkit-transition-duration: " + beatDur + "s; transition-duration: " + beatDur + "s; " + 
			"-moz-transform: translate(" + pendulumSwingX + ", 0px); -webkit-transform: translate(" + pendulumSwingX + ", 0px); transform: translate(" + pendulumSwingX + ", 0px); "
		);
	
		var setAni = 
			"-moz-animation: opa " + beatDur + "s cubic-bezier(0, 0.62, 0.36, 1); " +
			"-webkit-animation: opa " + beatDur + "s cubic-bezier(0, 0.62, 0.36, 1); " +
			"animation: opa " + beatDur + "s cubic-bezier(0, 0.62, 0.36, 1); ";
		
		var unsetAni = '-moz-animation-name: none; -webkit-animation-name: none; animation-name: none';
	
		if (currentBeatsEven) {
			pendulumHit.setAttribute('style', setAni);
			pendulumHit2.setAttribute('style', unsetAni);
		} else {
			pendulumHit.setAttribute('style', unsetAni);
			pendulumHit2.setAttribute('style', setAni);
		};
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
		
	}
	
	pubsubz.subscribe('beatsPerBar', updBeatsPerBarGUI);
	pubsubz.subscribe('beatUnit', updBeatUnitGUI);
// 	pubsubz.subscribe('start', resetPendulum);
	pubsubz.subscribe('stop', resetPendulum);
	
	metro.drawHook = function(currentBeatInBar, currentBeats, beatDur){
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