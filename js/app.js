      'use strict';
      var o = getStoredState('latest');      
      var m = new WebAudio_Metro(o); 
      m.init();
      var g = new MetroGUI(o);
      g.metro = m; 
			g.init();
/*
separate testing, code where? (browser console, some templates?)
metro alone 
gui alone (proxy, or maybe a not "inited" metro)
new gui w/ existing metro
new metro to existing gui

(would need destructors? unsubscribe pub sub, what else, audio context, worker)


find out if useful if both could share a common state object in their constructor's prototypes
?
*/