	function post(str){
		var el = document.createElement('span');
		el.textContent = str;
		postView.appendChild(el); // by id, obj only in gui.js
	}
	function postln(str){
		var el = document.createElement('div');
		el.textContent = str;
		postView.appendChild(el);
	}
	
	// only for old iOS 5 iPad (gui, layout, no audio anyway, but storage !)
	// http://stackoverflow.com/questions/1729501/javascript-overriding-alert
	// MDN arguments
/*
	(function(proxied) {
		console.log = function() {
			// do something here // this is object Console
// 			postln(arguments[0]);

   		var args = new Array(arguments.length);
    	for(var i = 0; i < args.length; ++i) {
        //i is always valid index in the arguments object
      	args[i] = arguments[i];
    	};
			postln(args.join(" "));
			
			return proxied.apply(this, arguments);
		};
	})(console.log);
*/