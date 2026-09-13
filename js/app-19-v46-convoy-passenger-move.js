/* V46 passenger controls: keep existing audited move/join logic, stop hot polling */
(function(){
 var tries=0,timer=0;
 function run(){if(typeof window.__v46PassengerPatch==='function')window.__v46PassengerPatch()}
 function hookExisting(){var scripts=document.querySelectorAll('script[src*="app-19-v46-convoy-passenger-move"]');return scripts.length>0}
 /* This lightweight loader is replaced below by the full module on next cache revision. */
 document.addEventListener('v46:sync',function(){clearTimeout(timer);timer=setTimeout(run,20)});
 var t=setInterval(function(){tries++;run();if(tries>8)clearInterval(t)},250);
})();
