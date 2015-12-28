var audioContext = null;
var isPlaying = false;      // Are we currently playing?
// var startTime;              // The start time of the entire sequence.   NOT USED
// var current16thNote;        // What note is currently last scheduled?
var tempo = 120.0;          // tempo (in beats per minute)
var lookahead = 25.0;       // How frequently to call scheduling function 
                            //(in milliseconds)
var scheduleAheadTime = 0.1;    // How far ahead to schedule audio (sec)
                            // This is calculated from lookahead, and overlaps 
                            // with next interval (in case the timer is late)
var nextNoteTime = 0.0;     // when the next note is due.
// var noteResolution = 0;     // 0 == 16th, 1 == 8th, 2 == quarter note
var noteLength = 0.05;      // length of "beep" (in seconds)
var canvas,                 // the canvas element
    canvasContext;          // canvasContext is the canvas' context 2D
var last16thNoteDrawn = -1; // the last "box" we drew on the screen
var notesInQueue = [];      // the notes that have been put into the web audio,
                            // and may or may not have played yet. {note, time}
var timerWorker = null;     // The Web Worker used to fire timer messages

var mainGainNode; // testing
var gain = 0.5; // tempo and gain defaults here


var beatsPerBar = 3; // positive integer
var beatUnit = 1 / 2; 
var currentBeat;
var nextBeatsPerBar = beatsPerBar, nextBeatUnit = beatUnit; // change only at next bar line (?)

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
    // Advance current note and time by a 16th note... No, beat
    var secondsPerBeat = 60.0 / tempo;    // Notice this picks up the CURRENT 
                                          // tempo value to calculate beat length.
    nextNoteTime += beatUnit * 4 * secondsPerBeat;    // Add beat length to last beat time

//     currentBeat++;    // Advance the beat number, wrap to zero
//     if (currentBeat == beatsPerBar) {
//         currentBeat = 0;
//     };
    currentBeat = (currentBeat + 1) % beatsPerBar; // allow beatsPerBar change in bar (?)
}
// beatNumber is passed in currentBeat
function scheduleNote( beatNumber, time ) {
    // push the note on the queue, even if we're not playing.
    notesInQueue.push( { note: beatNumber, time: time } );

    // create an oscillator
    var osc = audioContext.createOscillator();    
    var eg = audioContext.createGain();
    
    eg.gain.setValueAtTime(1.0, time);
    eg.gain.setValueAtTime(1.0, time + (noteLength / 7));
    eg.gain.exponentialRampToValueAtTime(0.001, time + noteLength);
    
    osc.type = [ "sine", "square", "sawtooth", "triangle" ][3];
    osc.connect(eg);
    eg.connect( mainGainNode );
    
//     console.log(beatNumber); // correct, but no sound on first zero (fixed ?)
    
//     if (beatNumber % 16 === 0)    // beat 0 == low pitch
//         osc.frequency.value = 880.0;
//     else if (beatNumber % 4 === 0 )    // quarter notes = medium pitch
//         osc.frequency.value = 440.0;
//     else                        // other 16th notes = high pitch
//         osc.frequency.value = 220.0;
    
    if (beatNumber === 0){ // the ONE
      
      // here ? works
      if (nextBeatsPerBar != beatsPerBar) { beatsPerBar = nextBeatsPerBar };
      if (nextBeatUnit != beatUnit) { beatUnit = nextBeatUnit };
      
      osc.frequency.value = 880.0;
    };
    osc.start( time );
    osc.stop( time + noteLength );
}

function scheduler() {
    // while there are notes that will need to play before the next interval, 
    // schedule them and advance the pointer.
    while (nextNoteTime < audioContext.currentTime + scheduleAheadTime ) {
        scheduleNote( currentBeat, nextNoteTime );
        nextNote();
    }
}

function play() {
    isPlaying = !isPlaying;

    if (isPlaying) { // start playing        
        currentBeat = 0;
        nextNoteTime = audioContext.currentTime + 0.1; // now can hear first beat !
        timerWorker.postMessage("start");
        return "stop";
    } else {
        timerWorker.postMessage("stop");
        return "play";
    }
}

function resetCanvas (e) {
    // resize the canvas - but remember - this clears the canvas too.
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    //make sure we scroll to the top left.
    window.scrollTo(0,0); 
}

function draw() {
    var currentNote = last16thNoteDrawn;
    var currentTime = audioContext.currentTime;

    while (notesInQueue.length && notesInQueue[0].time < currentTime) {
        currentNote = notesInQueue[0].note;
        notesInQueue.splice(0,1);   // remove note from queue
    }

    // We only need to draw if the note has moved.
    if (last16thNoteDrawn != currentNote) {
        var x = Math.floor( canvas.width / 18 );
        canvasContext.clearRect(0,0,canvas.width, canvas.height); 
        for (var i=0; i<16; i++) {
            canvasContext.fillStyle = ( currentNote == i ) ? 
                ((currentNote%4 === 0)?"red":"blue") : "black";
            canvasContext.fillRect( x * (i+1), x, x/2, x/2 );
        }
        last16thNoteDrawn = currentNote;
    }

    // set up to draw again
    requestAnimFrame(draw);
}


function setMainGain(val){
    gain = val;
    mainGainNode.gain.value = gain;
}

function init(){
    var container = document.createElement( 'div' );
    
    container.className = "container";
    canvas = document.createElement( 'canvas' );
    canvasContext = canvas.getContext( '2d' );
    canvas.width = window.innerWidth; 
    canvas.height = window.innerHeight; 
    document.body.appendChild( container );
    container.appendChild(canvas);    
    canvasContext.strokeStyle = "#ffffff";
    canvasContext.lineWidth = 2;

    // NOTE: THIS RELIES ON THE MONKEYPATCH LIBRARY BEING LOADED FROM
    // Http://cwilso.github.io/AudioContext-MonkeyPatch/AudioContextMonkeyPatch.js
    // TO WORK ON CURRENT CHROME!!  But this means our code can be properly
    // spec-compliant, and work on Chrome, Safari and Firefox.
    
    // swit-ch: forked it too to link locally (offline)
  
  if (window.AudioContext == undefined || window.Worker == undefined) {
    console.log("AudioContext or Worker undefined. Return early from 'init' now.");
    disablePlayCtls();
    return;
  };
  
    audioContext = new AudioContext();

    // if we wanted to load audio files, etc., this is where we should do it.
    
    mainGainNode = audioContext.createGain();
    setMainGain(gain); // init
    mainGainNode.connect( audioContext.destination );

    window.onorientationchange = resetCanvas;
    window.onresize = resetCanvas;

//     requestAnimFrame(draw);    // start the drawing loop.

    timerWorker = new Worker("js/metronomeworker.js");

    timerWorker.onmessage = function(e) {
        if (e.data == "tick") {
            // console.log("tick!");
            scheduler();
        }
        else
            console.log("message: " + e.data);
    };
    timerWorker.postMessage({"interval":lookahead});
}

window.addEventListener("load", init );

