'use strict';
// main variables defined in metronome.js
// here event listeners added, script at bottom of body

var useBarView = true;
var usePendulum = true;


var tempoSpec = { min: 10, max: 400, step: 1 };
var gainSpec = {  min: 0, max: 1, step: "any" };


// could as well create the widgets right here, instead of this:
var playCtl = document.getElementById('playCtl');
			
var beatsPerBarCtl = document.getElementById('beatsPerBarCtl');
var beatUnitCtl = document.getElementById('beatUnitCtl');

var tempoCtl = document.getElementById('tempoCtl');
var showTempoCtl = document.getElementById('showTempoCtl');
var gainCtl = document.getElementById('gainCtl');
var showGainCtl = document.getElementById('showGainCtl');

var barView = document.getElementById('barView'); // a canvas

// used in metronome.js draw ... (?)
var pendulumContainer = document.getElementById('pendulumContainer');
var pendulumSwing = document.getElementById('pendulumSwing');
var pendulumHit = document.getElementById('pendulumHit');
var pendulumHit2 = document.getElementById('pendulumHit2');
var pendulumWidth; // dynamic updated

var pendulumSwitch = document.getElementById('pendulumSwitch');

var debugContainer = document.getElementById('debugContainer');
var postView = document.getElementById('postView');
 
var trigCtl = document.getElementById('trigCtl');
var trigCtl1 = document.getElementById('trigCtl1');
			
// setAttribute any better ?
tempoCtl.min = tempoSpec.min;
tempoCtl.max = tempoSpec.max;
tempoCtl.step = tempoSpec.step;
tempoCtl.value = tempo;

// maybe have ez soon (also gainCtl)
showTempoCtl.min = tempoSpec.min;
showTempoCtl.max = tempoSpec.max;
showTempoCtl.step = tempoSpec.step;
showTempoCtl.value = tempo;
showTempoCtl.pattern = "[0-9]*";
showTempoCtl.inputmode= "numeric";

gainCtl.min = gainSpec.min;
gainCtl.max = gainSpec.max;
gainCtl.step = gainSpec.step;
gainCtl.value = gain;

showGainCtl.min = gainSpec.min;
showGainCtl.max = gainSpec.max;
//       showGainCtl.step = gainSpec.step;
showGainCtl.step = 0.01;
showGainCtl.value = gain;

			

var beatsPerBarObj = {
	values: [
		1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23 
	]
};
beatsPerBarObj.labels = beatsPerBarObj.values;
beatsPerBarObj.len = beatsPerBarObj.values.length;
for(var i = 0; i < beatsPerBarObj.len; i++){
	var o = document.createElement('option');
	o.textContent = beatsPerBarObj.labels[i];
	beatsPerBarCtl.add(o);
};

var beatUnitObj = {
	labels: [ '1', '1 / 2', '1 / 4', '1 / 8', '1 / 16', '1 / 32'  ] 
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

tempoCtl.style.width = tempoSpec.max - tempoSpec.min + 1 + 'px';
tempoCtl.style.maxWidth = '100%'; // ha !
gainCtl.style.width = tempoCtl.style.width;
gainCtl.style.maxWidth = '100%';

function updShowTempo(){
//         showTempo.textContent = tempo;
	showTempoCtl.value = tempo;
}
function updShowGain(){
//         showGain.textContent = Math.round(gain * 100) / 100;
	showGainCtl.value = Math.round(gain * 100) / 100;
}

// indexOf tests for strict equality
function updBeatsPerBarGUI(){
	// special case: next is set, next bar not reached (?)
	var val = nextBeatsPerBar || beatsPerBar;
	beatsPerBarCtl.selectedIndex = beatsPerBarObj.values.indexOf(val);
}
function updBeatUnitGUI(){
var val = nextBeatUnit || beatUnit;
	beatUnitCtl.selectedIndex = beatUnitObj.values.indexOf(val);
}


function togglePlay(ev){
	var str = play();
	playCtl.textContent = str;
}

function setTempo(bpm){
	tempo = bpm;
	updShowTempo();
}
function setGain(val){
	setMainGain(val); // defined in metronome.js
	updShowGain();
}


function setBeatsPerBar(n) { // test, constrain ?
//         beatsPerBar = n;
	nextBeatsPerBar = n;
}
function setBeatUnit(x) {
//         beatUnit = x;
	nextBeatUnit = x;
}


// here now, called in metronome.js but layout related

function resetBarView (e) {
	// resize the canvas - but remember - this clears the canvas too.
//         barView.width = window.innerWidth;
	barView.width = parseInt(pendulumWidth);
	
	barView.height = 30;
	//make sure we scroll to the top left.
	window.scrollTo(0, 0); // onorientationchange
}
function resetPendulum() {
  pendulumSwing.setAttribute(
    'style', 
    '-moz-transform: translate(0px, 0px); -webkit-transform: translate(0px, 0px); transform: translate(0px, 0px); '
  );
  pendulumHit.classList.remove('otherHit');
}

// string incl "px" -- reliable ?
function getPendulumWidth(){
	pendulumWidth = window.getComputedStyle(pendulumContainer).width
}

function hideBarView(){
	barViewContainer.style.visibility = 'hidden';
	barViewSwitch.textContent = "show BarView";
}
function showBarView(){
	barViewContainer.style.visibility = 'visible';
	barViewSwitch.textContent = "hide BarView";
}
function hidePendulum(){
	pendulumContainer.style.visibility = 'hidden';
	pendulumSwitch.textContent = "show Pendulum";
}
function showPendulum(){
	pendulumContainer.style.visibility = 'visible';
	pendulumSwitch.textContent = "hide Pendulum";
}

playCtl.addEventListener('click', togglePlay, false); // touch ? click ev received iOS
//    playCtl.addEventListener('touchstart', togglePlay, false);

// NB: sets nextBeatsPerBar !
beatsPerBarCtl.addEventListener('change', function(ev){
	var ix = this.selectedIndex;
	setBeatsPerBar(beatsPerBarObj.values[ix]);
}, false);

// NB: sets nextBeatUnit !
beatUnitCtl.addEventListener('change', function(ev){
	var ix = this.selectedIndex;
	setBeatUnit(beatUnitObj.values[ix]);
}, false);

tempoCtl.addEventListener('input', function (ev){
	setTempo(this.value);
}, false);

gainCtl.addEventListener('input', function (ev){
	setGain(this.value);
}, false);

barViewSwitch.addEventListener('click', function(ev){
	if (useBarView){
		useBarView = false;
		hideBarView();
	} else {
		useBarView = true;
		showBarView();
	}
}, false);
pendulumSwitch.addEventListener('click', function(ev){
	if (usePendulum){
		usePendulum = false;
		hidePendulum();
	} else {
		usePendulum = true;
		showPendulum();
	}
}, false);

trigCtl.addEventListener('click', function (ev){
	scheduleNote(0, audioContext.currentTime); // beatNumber, time
}, false);
trigCtl1.addEventListener('click', function (ev){
	scheduleNote(1, audioContext.currentTime); // beatNumber, time
}, false);

// called in init func (on win load) of metronome.js if no audio context etc
function disablePlayCtls(){
		playCtl.disabled = true;
		trigCtl.disabled = true;
		trigCtl1.disabled = true;
}
			
// init gui
updBeatsPerBarGUI();
updBeatUnitGUI();
updShowTempo();
updShowGain();
if (useBarView){ showBarView() } else { hideBarView() };
if (usePendulum){ showPendulum() } else { hidePendulum() };




function drawBarView(currentBeatInBar){
	var x = Math.floor( barView.width / (beatsPerBar ) );
	canvasContext.clearRect(0, 0, barView.width, barView.height); 
	for (var i = 0; i < beatsPerBar; i++) {
		var test = Math.round(Math.random() * 200) + 55;
		test = "rgb(100, " + test + ", 100)";
		
		canvasContext.fillStyle = ( currentBeatInBar == i ) ? 
			((currentBeatInBar === 0) ? test : "#abf") : "#ccc";
		canvasContext.fillRect( x * i, 0, x / 2, 30 );
	}
}

// ah, 'beatDur' from context metronome.js function 'nextNote'
function animatePendulum (currentBeats) {
        // toggle was easier than those 2 states, should reset on restart (if last cur beat was even) ...
        var currentBeatsEven = currentBeats % 2 == 0;
        var pendulumX = currentBeatsEven ? ((parseInt(pendulumWidth) - 30) + "px") : "0px";
        
        pendulumSwing.setAttribute(
        	'style', 
        	"-moz-transition-duration: " + beatDur + "s; -webkit-transition-duration: " + beatDur + "s; transition-duration: " + beatDur + "s; " + 
        	"-moz-transform: translate(" + pendulumX + ", 0px); -webkit-transform: translate(" + pendulumX + ", 0px); transform: translate(" + pendulumX + ", 0px); "
        );				
				
        pendulumHit.setAttribute(
        	'style', 
        	"-moz-transition-duration: " + beatDur + "s; -webkit-transition-duration: " + beatDur + "s; transition-duration: " + beatDur + "s" 
        );
//         pendulumHit.classList.toggle('otherHit');
        if (currentBeatsEven){
        	pendulumHit.classList.add('otherHit'); } else {
        	pendulumHit.classList.remove('otherHit'); 
        };
        
        pendulumHit2.setAttribute(
        	'style', 
        	"-moz-transition-duration: " + beatDur + "s; -webkit-transition-duration: " + beatDur + "s; transition-duration: " + beatDur + "s"
        );
//         pendulumHit2.classList.toggle('otherHit2'); 
        if (currentBeatsEven){
        	pendulumHit2.classList.add('otherHit2'); } else {
        	pendulumHit2.classList.remove('otherHit2'); 
        };
}

function draw() {
		//  was "currentNote" -- lastBeatInBarDrawn bad name
    var currentBeatInBar = lastBeatInBarDrawn; 
    var currentBeats = lastBeatsDrawn; // new (Doppelmoppel ? counter explosion)
    
    var currentTime = audioContext.currentTime;

    while (notesInQueue.length && notesInQueue[0].time < currentTime) {
			currentBeatInBar = notesInQueue[0].beatInBar;
			currentBeats = notesInQueue[0].beats;
			notesInQueue.splice(0,1);   // remove note from queue
    }

    // We only need to draw if the note has moved.
//     if (lastBeatInBarDrawn != currentBeatInBar) {
//         var x = Math.floor( barView.width / 18 );
//         canvasContext.clearRect(0,0,barView.width, barView.height); 
//         for (var i=0; i<16; i++) {
//             canvasContext.fillStyle = ( currentBeatInBar == i ) ? 
//                 ((currentBeatInBar%4 === 0)?"red":"blue") : "black";
//             canvasContext.fillRect( x * (i+1), x, x/2, x/2 );
//         }
//         lastBeatInBarDrawn = currentBeatInBar;
//     }
		
		
		// hmm, special case one beatsPerBar !
    if //(lastBeatInBarDrawn != currentBeatInBar) 
    ( lastBeatsDrawn != currentBeats )
    {
			if (useBarView) {drawBarView(currentBeatInBar); };
      if (usePendulum) { animatePendulum(currentBeats); } ;
        
        lastBeatInBarDrawn = currentBeatInBar;
        lastBeatsDrawn = currentBeats;        
    };
    // set up to draw again
    requestAnimFrame(draw);
}