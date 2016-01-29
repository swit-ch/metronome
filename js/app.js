      'use strict';
      var o = getStoredState('latest');      
      var m = new WebAudio_Metro(o); // constructor now
      m.init();
      var g = makeMetroGUI(o);
      g.metro = m; // set does init (currently)

/*
separate testing, code where? (browser console, some templates?)
metro alone 
gui alone (proxy, or maybe a not "inited" metro)
new gui w/ existing metro
new metro to existing gui
*/