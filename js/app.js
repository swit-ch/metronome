      'use strict';
      var o = getStoredState('latest');
      var m = makeAudioMetro(o);      
      var g = makeMetroGUI(o);
      g.metro = m;

/*
separate testing, code where? (browser console)
metro alone
new gui w/ existing metro
new metro to existing gui
*/