"use strict";

// snap, clip, warps, steps to which obj ?

// round lke SC ?
function snap (val, step) {
	if (step ){ // not zero
		return Math.round(val / step) * step
	} else { return val }
}
function clip(num, lo, hi) {
		num = Math.min(num, hi);
		return Math.max(num, lo);
}


// 'default' is a keyword SyntaxError
// arg warp is identifier for warp, see 'warps'
function ControlSpec (minval, maxval, warp, step, defval, units) {
	this.minval = minval ? minval : 0;
	this.maxval = maxval ? maxval : 1;
	this.warp = warp ? new warps[warp](this) : new LinearWarp(this);
	this.step = step ? step : 0;
	
// 	this.defval = Number(defval) ? Number(defval) : this.minval;
	if (typeof defval == "number") {
		this.defval = defval } else {
		this.defval = this.minval;
	}
	
	this.units = units;
	
	var clipLo = Math.min(this.minval, this.maxval);
	var clipHi = Math.max(this.minval, this.maxval);
	
	this.constrain = function(val){
		val = clip(val, clipLo, clipHi);
		
		if (this.step) {
			return snap(val, step);
		} else { return val }
	}
	
	Object.defineProperty(this, 'range', {
			get: function(){ return this.maxval - this.minval } 
		}
	)
	Object.defineProperty(this, 'ratio', {
			get: function(){ return this.maxval / this.minval } 
		}
	)
	
	this.map = function(value) {
		// maps a value from [0..1] to spec range
		value = clip(value, 0, 1);
		value = this.warp.map(value);
		return snap(value, this.step);
	}
	this.unmap = function(value) {
		// maps a value from spec range to [0..1]
		return this.warp.unmap(
			clip(snap(value, step), clipLo, clipHi)
		)
	}
	
	
	
	this.guessNumberStep = function() {
			// first pass, good for linear warp
		var temp, numStep = this.range * 0.01;

			// for exponential warps, guess  again (hopefully educated)
		if (this.warp.asSpecifier == 'exp') {
			temp = Math.min(Math.abs(minval), Math.abs(maxval));			
			numStep = Math.min(temp, numStep) * 0.1;
		};
			// others could go here.

		return numStep
	}
}




// Warps specify the mapping from 0..1 and the control range

function LinearWarp (spec) { // test spec?
	this.spec = spec;
	this.map = function(value) {
		// maps a value from [0..1] to spec range
		return value * spec.range + spec.minval
	} 
	this.unmap = function(value) {
		// maps a value from spec range to [0..1]
		return (value - spec.minval) / spec.range
	}
	this.asSpecifier = 'lin';
}

function ExponentialWarp (spec) {
	// minval and maxval must both be non zero and have the same sign.
	this.spec = spec;
	this.map = function(value) {
		// maps a value from [0..1] to spec range
		return Math.pow(spec.ratio, value) * spec.minval
	}
	this.unmap = function(value) {
		// maps a value from spec range to [0..1]
		return Math.log(value/spec.minval) / Math.log(spec.ratio)
	}
	this.asSpecifier = 'exp';
}

function FaderWarp (spec) {
	//  useful mapping for amplitude faders
	this.spec = spec;
	this.map = function (value) {
		// maps a value from [0..1] to spec range
		if (spec.range >= 0) {
			return Math.pow(value, 2) * spec.range + spec.minval
		} else {
				// formula can be reduced to (2*v) - v.squared
				// but the 2 subtractions would be faster
			return (1 - Math.pow(1 - value, 2)) * spec.range + spec.minval
		}
	}
	this.unmap = function (value) {
		// maps a value from spec range to [0..1]
		if (spec.range >= 0) {
			return Math.sqrt((value - spec.minval) / spec.range)
		} else {
			return 1 - Math.sqrt(1 - ((value - spec.minval) / spec.range))
		}
	}
	this.asSpecifier = 'amp';
}

var warps = {
	'lin': LinearWarp,
	'exp': ExponentialWarp,
// 	'sin': SineWarp,
// 	'cos': CosineWarp,
	'amp': FaderWarp,
// 	'db': DbFaderWarp,
	'linear': LinearWarp,
	'exponential': ExponentialWarp
}

// minval, maxval, warp, step, defval, units
var specs = {
	'unipolar' : new ControlSpec(0, 1),
	'bipolar' : new ControlSpec(-1, 1, 'lin', 0, 0),
	'freq' : new ControlSpec(20, 20000, 'exp', 0, 440, "Hz"), 
	'amp' : new ControlSpec(0, 1, 'amp', 0, 0), 
	'midi' : new ControlSpec(0, 127, 'lin', 1, 64)
}