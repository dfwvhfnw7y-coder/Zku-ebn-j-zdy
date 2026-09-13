/* V46 live sync: Firebase listener is authoritative; V46 only refreshes its overlays */
(function(){
  var bound=false,lastSig='',timer=0;
  function norm(s){return String(s||'').trim().toLowerCase()}
  function eid(){return typeof getCurrentEventId==='function'?getCurrentEventId():''}
  function ev(){return typeof getEventName==='function'?getEventName():''}
  function inEvent(r){var id=eid();return id&&r.eventId?r.eventId===id:(r.event||'')===ev()}
  function activeMap(){var map={};if(typeof rides==='undefined'||!Array.isArray(rides))return map;for(var i=0;i<rides.length;i++){var r=rides[i];if(!r||r.end||!r.car||!inEvent(r))continue;var k=norm(r.car),old=map[k];if(!old||new Date(r.start||0)>new Date(old.start||0))map[k]=r}return map}
  function signature(){var map=activeMap(),parts=[];Object.keys(map).sort().forEach(function(k){var r=map[k],cs=r.customers||[];parts.push(k+'|'+(r._key||'')+'|'+(r.start||'')+'|'+cs.map(function(c){return c&&typeof c==='object'?(c.email||c.phone||c.name||''):String(c||'')}).join(','))});return parts.join('||')}
  function refreshOpenConvoy(){var overlay=document.getElementById('v46Convoy'),open=document.getElementById('v46ConvoyOpen');if(overlay&&overlay.classList.contains('show')&&open)open.click()}
  function emit(){document.dispatchEvent(new CustomEvent('v46:sync'))}
  function paint(){if(typeof window.v46PaintFleet==='function'){window.v46PaintFleet();if(typeof requestAnimationFrame==='function')requestAnimationFrame(window.v46PaintFleet)}}
  function sync(force){var sig=signature(),changed=force||sig!==lastSig;if(changed){lastSig=sig;refreshOpenConvoy()}paint();emit()}
  function schedule(force){clearTimeout(timer);timer=setTimeout(function(){sync(!!force)},25)}
  function settleFleet(){paint();setTimeout(paint,80);setTimeout(paint,260);setTimeout(paint,700)}
  function bindFirebase(){if(bound||typeof ridesRef==='undefined'||!ridesRef||typeof ridesRef.on!=='function')return;bound=true;ridesRef.on('value',function(){schedule(false);setTimeout(paint,60)})}
  function hardReload(){try{if(window.parent&&window.parent!==window){var u=new URL(window.parent.location.href);u.searchParams.set('_v46r',Date.now());window.parent.location.replace(u.toString());return}}catch(e){}var here=new URL(location.href);here.searchParams.set('_v46r',Date.now());location.replace(here.toString())}
  function patchRefresh(){window.refreshV45=hardReload;var b=document.getElementById('v45RefreshBtn');if(b&&!b.__v46HardReload){b.__v46HardReload=true;b.addEventListener('click',function(e){e.preventDefault();e.stopImmediatePropagation();hardReload()},true)}}
  window.v46LiveSync=function(){schedule(true)};
  bindFirebase();patchRefresh();sync(true);setTimeout(function(){bindFirebase();patchRefresh();sync(true)},350);
  document.addEventListener('click',function(e){patchRefresh();var t=e.target&&e.target.closest?e.target.closest('#v46Start,#v46Close'):null;if(t&&t.id==='v46Start')settleFleet();else if(t&&t.id==='v46Close')setTimeout(paint,0)},true);
})();