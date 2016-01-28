'use strict';

function makeAudioMetro (storedState) {

	// w/o storage.js need defaults ...
	var tempo = 60, gain = 0.1; // tempo change active at next beat
	var beatsPerBar = 4, beatUnit = 1 / 4;
	function setState(obj){
			if (obj.tempo) { tempo = obj.tempo; };
			// if (obj.gain) { gain = obj.gain; }; // might be zero
			
			if (obj.gain >= 0) { gain = obj.gain; }; // not negative ?
			
			if (obj.beatsPerBar) { beatsPerBar = obj.beatsPerBar; };
			if (obj.beatUnit) { beatUnit = obj.beatUnit; };
	}
	
	var ssm;
	if (storedState) {
		if(storedState.metro){
			ssm = storedState.metro;
			setState(ssm);
		}
	};
	
	var prevTempo = tempo; // new test (upd) -- need more of them, change emitted here ...
	var prevBeatsPerBar = beatsPerBar;
	var prevBeatUnit = beatUnit;
	
	var nextBeatsPerBar, nextBeatUnit; // change at next bar line (or if not playing on next play() )
	
	var beatInBar; // was 'currentBeat' 
	var beats; // since last 'play' 
	var beatDur; // new, for pendulum
	
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
	var nextNoteTime = 0.0;     // when the next note is due.
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

	function nextNote() {
		// Advance current note and time by a 16th note... No, one beat unit here
		var secondsPerBeat = 60.0 / tempo;    // Notice this picks up the CURRENT 
																					// tempo value to calculate beat length.
		// tempo change on next beat
		beatDur = beatUnit * 4 * secondsPerBeat;
	
		nextNoteTime += beatDur;    // Add beat length to last beat time

	//     beatInBar++;    // Advance the beat number, wrap to zero
	//     if (beatInBar == beatsPerBar) {
	//         beatInBar = 0;
	//     };
	
		// special case: 1 beatsPerBar !
		beatInBar = (beatInBar + 1) % beatsPerBar; // allow beatsPerBar change in bar 
		beats++;
		
		// here ?
		if (tempo != prevTempo) { pubsubz.publish('tempo', tempo); };
		prevTempo = tempo;
	}

	// iOS Safari hack
	function pseudoSound(){
		// create an oscillator, connecting not necessary
		var osc = audioContext.createOscillator();    
		var time = audioContext.currentTime;
		osc.start( time );
		osc.stop( time + 0.01 );
	}
	
	function updateTimeSignature (){
		if ( nextBeatsPerBar && (nextBeatsPerBar != beatsPerBar) ) {
			beatsPerBar = nextBeatsPerBar;
			nextBeatsPerBar = undefined;
			pubsubz.publish('beatsPerBar', beatsPerBar);
		};
		if ( nextBeatUnit && (nextBeatUnit != beatUnit) ) {
			beatUnit = nextBeatUnit;
			nextBeatUnit = undefined;
			pubsubz.publish('beatUnit', beatUnit);
		};
		
		if (beatsPerBar != prevBeatsPerBar) { pubsubz.publish('beatsPerBar', beatsPerBar); };
		if (beatUnit != prevBeatUnit) { pubsubz.publish('beatUnit', beatUnit); };
		prevBeatsPerBar = beatsPerBar;
		prevBeatUnit = beatUnit;
	}
	
	// beatNumber is passed in beatInBar ==> argBeatInBar
	// new testing argBeats
	function scheduleNote( argBeatInBar, time, argBeats ) {
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
	
		if (argBeatInBar === 0){ // the ONE
			// here ? works
			updateTimeSignature();
		
			osc.frequency.value = 880.0;
		};
		osc.start( time );
		osc.stop( time + noteLength );
	}

	function scheduler() {
		// while there are notes that will need to play before the next interval, 
		// schedule them and advance the pointer.
		while (nextNoteTime < audioContext.currentTime + scheduleAheadTime ) {
	//         scheduleNote( beatInBar, nextNoteTime );
				scheduleNote( beatInBar, nextNoteTime, beats );
				nextNote();
		}
	}
	
	// think want 'stop' too ...
	function play() {
		isPlaying = !isPlaying;
	
		if (isPlaying) { // start playing
				// iOS hack, otherwise audioContext suspended
			if (audioContext.state !== 'running'){ pseudoSound(); };
		
			beatInBar = 0;
			beats = 0;
			
			nextNoteTime = audioContext.currentTime + 0.04; // now can hear first beat !
			
			pubsubz.publish('start');
			
			timerWorker.postMessage("start");
			return "stop";
		} else {
			
			pubsubz.publish('stop');
			
			timerWorker.postMessage("stop");
			return "play";
		}
	}

	function setMainGain(val){
		gain = val;
		mainGainNode.gain.value = gain;
	}
	
	// override in gui
	function drawBeatHook(currentBeatInBar, currentBeats, beatDur){}
	
	// here again b/c of context, have drawBeatHook now
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
	
		// NOTE: THIS RELIES ON THE MONKEYPATCH LIBRARY BEING LOADED FROM
		// Http://cwilso.github.io/AudioContext-MonkeyPatch/AudioContextMonkeyPatch.js
		// TO WORK ON CURRENT CHROME!!  But this means our code can be properly
		// spec-compliant, and work on Chrome, Safari and Firefox.
	
		// swit-ch: forked it too to link locally (offline)

		if (window.AudioContext == undefined || window.Worker == undefined) {
			console.log("AudioContext and/or Worker undefined. Return early from 'init' now.");
// 			disablePlayCtls(); // gui.js
			return; // but then gui should not init() too !
		};

		audioContext = new AudioContext();
	
		////////////////////////////////////// knows about gui .........
	// 	audioContext.onstatechange = function(ev){ // have post, postln funcs ?
	// 		var ele = document.createElement('div');
	// 		ele.textContent = audioContext.currentTime + " event type : " + ev.type + " state : " + audioContext.state;
	// 		postView.appendChild(ele);
	// 	};
		////////////////////////////////////////
	
	
	
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
	}
	
	function getState() {
		return {
			"tempo": tempo, "gain": gain, "beatsPerBar": beatsPerBar, "beatUnit": beatUnit
		}
	}
	
	init();
	
	return {
// 		init: init, 
		play: play, // want stop too (later)
		get state(){ return getState() }, 
		set state(obj) { setState(obj) },
		
		get tempo(){ return tempo }, set tempo(n) { tempo = n }, 
		get gain() { return gain }, set gain(r) { setMainGain(r) }, 
		
// 		get tempo(){ return tempo }, 
// 		set tempo(n) { tempo = n; pubsubz.publish('tempo', tempo);  }, 
// 		get gain() { return gain }, 
// 		set gain(r) { setMainGain(r); pubsubz.publish('gain', gain);  }, 
		
		// differentiaton setDirectly setNext in gui.js
		
// 		get beatsPerBar() { return beatsPerBar }, 
// 		set beatsPerBar(n) { beatsPerBar = n; pubsubz.publish('beatsPerBar', beatsPerBar); }, // on next beat
// 		get nextBeatsPerBar() { return nextBeatsPerBar }, 
// 		set nextBeatsPerBar(n) { nextBeatsPerBar = n; pubsubz.publish('nextBeatsPerBar', nextBeatsPerBar); },  // on next bar
// 		get beatUnit() { return beatUnit }, 
// 		set beatUnit(n) { beatUnit = n; pubsubz.publish('beatUnit', beatUnit); }, // on next beat
// 		get nextBeatUnit() { return nextBeatUnit }, 
// 		set nextBeatUnit(r) { nextBeatUnit = r; pubsubz.publish('nextBeatUnit', nextBeatUnit); }, // on next bar
		
		get beatsPerBar() { return beatsPerBar }, set beatsPerBar(n) { beatsPerBar = n }, // on next beat
		get nextBeatsPerBar() { return nextBeatsPerBar }, set nextBeatsPerBar(n) { nextBeatsPerBar = n },  // on next bar
		get beatUnit() { return beatUnit }, set beatUnit(n) { beatUnit = n }, // on next beat
		get nextBeatUnit() { return nextBeatUnit }, set nextBeatUnit(r) { nextBeatUnit = r }, // on next bar
		
		get drawBeatHook() { return drawBeatHook }, set drawBeatHook(f) { drawBeatHook = f }, 
		get isPlaying () { return isPlaying }, 
		get audioContext() { return audioContext } // debug?
// 		get timerWorker() { return timerWorker }
	}
}