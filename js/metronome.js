'use strict';

/* motivation for constructor: pass this obj to publishing (?) */


function WebAudio_Metro () {
	var THIS = this;
	var inited = false;
	
// 	var beatsPerBar = 4, beatUnit = 1 / 4, tempo = 60, gain = 0.1; // tempo change active at next beat
	var beatsPerBar, beatUnit, tempo, gain; // 'init' will need state eventually...
	var nextBeatsPerBar, nextBeatUnit; // change at next bar line (or if not playing on next play() )
	
	// change emitted here, not any, but "sample and hold" on beat or bar
	var prevBeatsPerBar = beatsPerBar, prevBeatUnit = beatUnit, prevTempo = tempo, prevGain = gain;
		
	var beatInBar; // was 'currentBeat' 
	var beats; // since last 'play' 
	var beatDur; // new, for gui pendulum
	
	var mainGainNode; 

	var audioContext = null;
	var isPlaying = false;      // Are we currently playing?
	// var startTime;              // The start time of the entire sequence.   NOT USED
	// var current16thNote;        // What note is currently last scheduled? ==> beatInBar
	var lookahead = 25.0;       // How frequently to call scheduling function 
															//(in milliseconds)
	var scheduleAheadTime = 0.1;    // How far ahead to schedule audio (sec)
															// This is calculated from lookahead, and overlaps 
															// with next interval (in case the timer is late)
	var nextBeatTime = 0.0;     // when the next note is due. -- was nextNoteTime, now less versatile
	// var noteResolution = 0;     // 0 == 16th, 1 == 8th, 2 == quarter note
	var noteLength = 0.05;      // length of "beep" (in seconds)

	// var last16thNoteDrawn = -1; // the last "box" we drew on the screen

	// var lastBeatDrawn = -1; // the last "box" we drew on the screen
	var lastBeatInBarDrawn = -1;
	var lastBeatsDrawn = -1;

	var notesInQueue = [];      // the notes that have been put into the web audio,
															// and may or may not have played yet. {note, time}
	// note becomes beatInBar, added beats
	var timerWorker = null;     // The Web Worker used to fire timer messages
	
	function notify() {
// 		console.log("metronome notify", THIS);
		pubsubz.publish.apply(null, arguments);
// 		pubsubz.publish.apply(null, [THIS, arguments[0], arguments[1]]); // untested, for ===
		
	}

	// First, let's shim the requestAnimationFrame API, with a setTimeout fallback
	window.requestAnimFrame = (function(){
		return  window.requestAnimationFrame ||
		window.webkitRequestAnimationFrame ||
		window.mozRequestAnimationFrame ||
		window.oRequestAnimationFrame ||
		window.msRequestAnimationFrame ||
		function( callback ){
				window.setTimeout(callback, 1000 / 60);
		};
	})();

	// iOS Safari hack
	function pseudoSound(){
		// create an oscillator, connecting not necessary
		var osc = audioContext.createOscillator();    
		var time = audioContext.currentTime;
		osc.start( time );
		osc.stop( time + 0.01 );
	}
	
	function updateMeterAtBarLine (){
// 		console.log("metronome updateMeterAtBarLine");
		
		if ( nextBeatsPerBar && (nextBeatsPerBar != beatsPerBar) ) {
			beatsPerBar = nextBeatsPerBar;
			nextBeatsPerBar = undefined;
			notify('beatsPerBar', beatsPerBar);
			
			prevBeatsPerBar = beatsPerBar; // for updateMeterAtBeat
		};
		if ( nextBeatUnit && (nextBeatUnit != beatUnit) ) {
			beatUnit = nextBeatUnit;
			nextBeatUnit = undefined;
			notify('beatUnit', beatUnit);
			
			prevBeatUnit = beatUnit; // for updateMeterAtBeat
		};
	}
	function updateMeterAtBeat(){
// 		console.log("metronome updateMeterAtBeat");
		
		if (beatsPerBar != prevBeatsPerBar) { notify('beatsPerBar', beatsPerBar); };
		if (beatUnit != prevBeatUnit) { notify('beatUnit', beatUnit); };
		prevBeatsPerBar = beatsPerBar;
		prevBeatUnit = beatUnit;
	}
	
	
	// scheduling other things here now? Tooo early ? By up to scheduleAheadTime ? Even one beat ?
	// called right after scheduleBeat(), here already preparing the next beat ...
	 
	function nextBeat() { // former name nextNote
		// Advance current note and time by a 16th note... No, one beat unit here
		var secondsPerBeat = 60.0 / tempo;    // Notice this picks up the CURRENT 
																					// tempo value to calculate beat length.
		// tempo change on next beat
		beatDur = beatUnit * 4 * secondsPerBeat;
		nextBeatTime += beatDur;    // Add beat length to last beat time
	
		// special case: 1 beatsPerBar !
		beatInBar = (beatInBar + 1) % beatsPerBar; // allow beatsPerBar change in bar 
		beats++;
		
// 		console.log("metronome nextBeat beatInBar : " + beatInBar + " beats : " + beats);
	}
	
	// beatNumber is now passed in beatInBar, now argBeatInBar 	
	function scheduleBeat( argBeatInBar, time, argBeats ) { // former name scheduleNote
		
		var theOne = argBeatInBar === 0;
		
		// push the note on the queue, even if we're not playing.
		notesInQueue.push( { beatInBar: argBeatInBar, time: time, beats: argBeats } );

		// create an oscillator
		var osc = audioContext.createOscillator();    
		var eg = audioContext.createGain();
	
		eg.gain.setValueAtTime(1.0, time);
		eg.gain.setValueAtTime(1.0, time + (noteLength / 7));
		eg.gain.exponentialRampToValueAtTime(0.001, time + noteLength);
	
		osc.type = [ "sine", "square", "sawtooth", "triangle" ][3];
		osc.connect(eg);
		eg.connect( mainGainNode );
	
		if (theOne){ osc.frequency.value = 880.0; };
		
		osc.start( time );
		osc.stop( time + noteLength );
		
		
		////////////
		if (theOne){ updateMeterAtBarLine(); };
		updateMeterAtBeat();
		
// 		tempo++; // ha !
// 		tempo = tempo + (1 / 3);
		
// 		if (tempo < 160) {
// 			tempo = tempo + 0.5;
// 		};
		
		// tempo from outer context (okay?)
		if (tempo != prevTempo) { notify('tempo', tempo); prevTempo = tempo; };
		if (gain != prevGain) { notify('gain', gain); prevGain = gain; };
// 		console.log("metronome scheduleBeat " + Date.now());
	}

	function scheduler() {
		// while there are notes that will need to play before the next interval, 
		// schedule them and advance the pointer.
		while (nextBeatTime < audioContext.currentTime + scheduleAheadTime ) {
	//         scheduleBeat( beatInBar, nextBeatTime );
				scheduleBeat( beatInBar, nextBeatTime, beats );
				nextBeat();
		}
	}
	
	// always wanted 'stop' too ;-)
	function play(){
		if (! inited) {
			console.log(THIS + " not inited");
			return;
		};		
		if (isPlaying) { console.log(THIS + " _already_ playing" ); return };
		
			// iOS hack, otherwise audioContext suspended
		if (audioContext.state !== 'running'){ pseudoSound(); };
	
		beatInBar = 0;
		beats = 0;
		nextBeatTime = audioContext.currentTime + 0.04; // now can hear first beat !
		
		timerWorker.postMessage("start");
		notify('start');
		isPlaying = true;
	}
	
	function stop(){
		if (! isPlaying) { console.log(THIS + " _not_ playing" ); return };
		
		timerWorker.postMessage("stop");
		notify('stop');
		isPlaying = false;
	}
	
	
/*
	function togglePlay() {
		
		if (! inited) {
			console.log(THIS + " not inited");
			return;
		};
		
		isPlaying = !isPlaying;
	
		if (isPlaying) { // start playing
				// iOS hack, otherwise audioContext suspended
			if (audioContext.state !== 'running'){ pseudoSound(); };
		
			beatInBar = 0;
			beats = 0;
			
			nextBeatTime = audioContext.currentTime + 0.04; // now can hear first beat !
			
			notify('start');
			
			timerWorker.postMessage("start");
			return "stop";
		} else {
			
			notify('stop');
			
			timerWorker.postMessage("stop");
			return "play";
		}
	}
*/
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	function setMainGain(val){
		gain = val;
		mainGainNode.gain.value = gain;
	}
	
	// override in gui
	function drawBeatHook(currentBeatInBar, currentBeats, beatDur){}
	
	// have drawBeatHook now
	function drawBeat() {
			//  was "currentNote" -- lastBeatInBarDrawn bad name
			var currentBeatInBar = lastBeatInBarDrawn; 
			var currentBeats = lastBeatsDrawn; // new (Doppelmoppel ? counter explosion)
		
			var currentTime = audioContext.currentTime;

			while (notesInQueue.length && notesInQueue[0].time < currentTime) {
				currentBeatInBar = notesInQueue[0].beatInBar;
				currentBeats = notesInQueue[0].beats;
				notesInQueue.splice(0, 1);   // remove note from queue
			}

			// We only need to draw if the note has moved.

			// hmm, special case one beatsPerBar !
			if //(lastBeatInBarDrawn != currentBeatInBar) 
			( lastBeatsDrawn != currentBeats ) // ah, if stopped right after beat zero problem ...
			{
				drawBeatHook(currentBeatInBar, currentBeats, beatDur); 
				
				lastBeatInBarDrawn = currentBeatInBar;
				lastBeatsDrawn = currentBeats;        
			};
			// set up to draw again
			requestAnimFrame(drawBeat);
	}

	function init(){
		if (! inited){
		// NOTE: THIS RELIES ON THE MONKEYPATCH LIBRARY BEING LOADED FROM
		// Http://cwilso.github.io/AudioContext-MonkeyPatch/AudioContextMonkeyPatch.js
		// TO WORK ON CURRENT CHROME!!  But this means our code can be properly
		// spec-compliant, and work on Chrome, Safari and Firefox.
	
		// swit-ch: forked it too to link locally (offline)

		if (window.AudioContext == undefined || window.Worker == undefined) {
			console.log("AudioContext and/or Worker undefined. Return early from 'init' now.");
// 			disablePlayCtls(); // gui.js
			return; 
		};

		audioContext = new AudioContext();
	
		audioContext.onstatechange = function(ev){
			notify('audioContext_statechange', ev);
		};
	
	
	
		// if we wanted to load audio files, etc., this is where we should do it.
	
		mainGainNode = audioContext.createGain();
		setMainGain(gain); // init
		mainGainNode.connect( audioContext.destination );
	
		requestAnimFrame(drawBeat);    // start the drawing loop.

		timerWorker = new Worker("js/metronomeworker.js");

		timerWorker.onmessage = function(e) {
			var data = e.data;
			if (data == "tick") {
				scheduler();
			} else {
				console.log("message: " + data);
			}
		};
		timerWorker.postMessage({"interval":lookahead});
		
		inited = true;
		} else { console.log(THIS + " already inited"); }
	}
	
	function getState() {
		return {
			tempo: tempo, gain: gain, beatsPerBar: beatsPerBar, beatUnit: beatUnit
		}
	}
	function setState(obj){
			if (obj.tempo) { tempo = obj.tempo; };
			// if (obj.gain) { gain = obj.gain; }; // might be zero
			
			if (obj.gain >= 0) { gain = obj.gain; }; // not negative ?
			
			if (obj.beatsPerBar) { beatsPerBar = obj.beatsPerBar; };
			if (obj.beatUnit) { beatUnit = obj.beatUnit; };
	}
			
	Object.defineProperties(this, {
		'isPlaying': { get: function(){ return isPlaying }, enumerable: true }, 
		
		'init': { value: init, enumerable: true }, 
		'play': { value: play, enumerable: true }, 
		'stop': { value: stop, enumerable: true }, 
		
		'getState': { value: getState, enumerable: true }, 
		'setState': { value: setState, enumerable: true }, 
		
		'beatsPerBar': { 
			get: function(){ return beatsPerBar }, 
			set: function(n) { beatsPerBar = n }, // on next beat
			enumerable: true
		},

		'beatUnit': {
		 	get: function() { return beatUnit }, 
		 	set: function(n) { beatUnit = n }, // on next beat
		 	enumerable: true
		},
		'tempo': { // have nextTempo too ?
			get: function() { return tempo }, 
			set: function(n) { tempo = n }, // next beat
			enumerable: true
		}, 
		'gain': {
			get: function() { return gain }, 
			set: function(r) { setMainGain(r) }, 
			enumerable: true
		}, 
		
		'nextBeatsPerBar': {
		 	get: function() { return nextBeatsPerBar }, 
		 	set: function(n) { nextBeatsPerBar = n },  // on next bar
		 	enumerable: true
		}, 
		'nextBeatUnit': {
		 	get: function() { return nextBeatUnit }, 
		 	set: function(r) { nextBeatUnit = r }, // on next bar
		 	enumerable: true
		}, 
		
		'drawBeatHook': {
			get: function() { return drawBeatHook }, 
			set: function(f) { drawBeatHook = f }, 
			enumerable: true
		}
	});
}