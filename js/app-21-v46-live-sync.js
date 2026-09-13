/* V46 live sync: one debounced render per Firebase change, no polling */
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
  function sync(force){var sig=signature(),changed=force||sig!==lastSig;if(changed){lastSig=sig;if(typeof renderAll==='function')renderAll();refreshOpenConvoy()}if(typeof window.v46PaintFleet==='function')window.v46PaintFleet();emit()}
  function schedule(force){clearTimeout(timer);timer=setTimeout(function(){sync(!!force)},45)}
  function bindFirebase(){if(bound||typeof ridesRef==='undefined'||!ridesRef||typeof ridesRef.on!=='function')return;bound=true;ridesRef.on('value',function(){schedule(false)})}
  function patchRefresh(){if(window.__v46RefreshPatched)return;window.__v46RefreshPatched=true;var old=window.refreshV45;window.refreshV45=function(){try{if(window.parent&&window.parent!==window){window.parent.location.reload();return}}catch(e){}if(typeof old==='function')old();else location.reload()};var b=document.getElementById('v45RefreshBtn');if(b)b.onclick=window.refreshV45}
  window.v46LiveSync=function(){schedule(true)};
  bindFirebase();patchRefresh();sync(true);
  setTimeout(function(){bindFirebase();patchRefresh();sync(true)},500);
})();
