// requires warp.js
// find out if useful in metronome project

"use strict";
/*
maybe still easier to take args (controlSpec, initVal) to new for init 
instead of versatility w/ setters (but everything's ready ?)
Original idea was that widgets already exist, behaviour attached
Was good for independent testing (dummies)
*/

function EZbehaviour (argControlSpec, argNumberView, argSliderView) {
	var ez = this; // ah, ev listeners, map a.o. funcs
 	var value; // own get set
	this.round = 0.001; // numberView -- need setter now to initialize !?
	
	this.controlSpec = argControlSpec ? argControlSpec : new ControlSpec(); // sugar ?
	var numberStep = this.controlSpec.step; 
	var sliderStep = numberStep;
	if (numberStep == 0) { numberStep = this.controlSpec.guessNumberStep(); };
	if (sliderStep == 0) { sliderStep = "any"; };
	
	this.numberView = argNumberView;
	this.sliderView = argSliderView;


// in SC sliderView no step !?!
	// normalized now ... ==>
	// actually for linear warps min, max, step from spec are fine, no mapping ...
	function setValueDirect (ev){
		ez.value = ev.target.value; // call value setter
	}
	function setValueMapped (ev){
		ez.value = ez.controlSpec.map(ev.target.value);  // call value setter
	}
	
	var setSlider; // declaration outside func scope
	
	function prepSlider(){
		var sl = ez.sliderView, spec = ez.controlSpec; // ez for 'this'
		var specLinear = spec.warp.asSpecifier == 'lin';
		sl.type = 'range';
		if (specLinear){
			sl.min = spec.minval;
			sl.max = spec.maxval;
			sl.step = sliderStep;
			sl.addEventListener('input', setValueDirect, false);
			setSlider = function (val){
				sl.value = val;
			}
		} else {
			sl.min = 0;
			sl.max = 1;
			sl.step = "any"; // like SC ?
			sl.addEventListener('input', setValueMapped, false);
			setSlider = function (val){
				sl.value = spec.unmap(val);
			}
		}
	}
	function prepNumber(){
		var nv = ez.numberView, spec = ez.controlSpec;
		nv.type = 'number';
		nv.min = spec.minval;
		nv.max = spec.maxval;
		nv.step = numberStep;
		nv.addEventListener('input', setValueDirect, false);
	}
	
	this.onValueChange = function(){}; // override w/ action, arg this
	
	// should setters return object ?
	Object.defineProperties(this, { // "pseudo properties" getters, setters
		'value': {
			get: function(){ return value }, 
			set: function(val){ // always set both slider, num (?)
				val = this.controlSpec.constrain(val);								
				this.numberView.value = snap(val, this.round);
				setSlider(val); // cond. in prepSlider
				value = val; // not to this, looooooop
				this.onValueChange(this); // action
			}
		} 
	});
	
	prepSlider();
	prepNumber();
	this.value = this.controlSpec.defval;	
}