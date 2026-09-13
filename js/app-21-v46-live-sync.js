/* V46 live sync: refresh convoy/fleet immediately after Firebase data changes */
(function(){
  var bound=false,lastSig='';
  function norm(s){return String(s||'').trim().toLowerCase()}
  function eid(){return typeof getCurrentEventId==='function'?getCurrentEventId():''}
  function ev(){return typeof getEventName==='function'?getEventName():''}
  function inEvent(r){var id=eid();return id&&r.eventId?r.eventId===id:(r.event||'')===ev()}
  function activeMap(){var map={};if(typeof rides==='undefined'||!Array.isArray(rides))return map;for(var i=0;i<rides.length;i++){var r=rides[i];if(!r||r.end||!r.car||!inEvent(r))continue;var k=norm(r.car),old=map[k];if(!old||new Date(r.start||0)>new Date(old.start||0))map[k]=r}return map}
  function signature(){var map=activeMap(),parts=[];Object.keys(map).sort().forEach(function(k){var r=map[k],cs=r.customers||[];parts.push(k+'|'+(r._key||'')+'|'+(r.start||'')+'|'+cs.map(function(c){return c&&typeof c==='object'?(c.email||c.phone||c.name||''):String(c||'')}).join(','))});return parts.join('||')}
  function paintFleet(){var map=activeMap(),cards=document.querySelectorAll('#v44FleetGrid .v44-vehicle');for(var i=0;i<cards.length;i++){var card=cards[i],nameEl=card.querySelector('.v44-vehicle-name');if(!nameEl)continue;var r=map[norm(nameEl.textContent)],st=card.querySelector('.v44-fleet-status'),dr=card.querySelector('.v44-fleet-driver');card.classList.toggle('is-driving',!!r);if(st){st.classList.toggle('busy',!!r);st.classList.toggle('free',!r);st.textContent=r?'Právě jede':'Volné'}if(dr&&!dr.classList.contains('pending')){if(r){var d=r.customers&&r.customers[0];dr.textContent='👤 '+(d&&typeof d==='object'?(d.name||d.email||d.phone||'Řidič'):(d||'Řidič'))}else dr.textContent='Připraveno k jízdě'}}var sum=document.getElementById('v45LiveSummary');if(sum){var spans=sum.querySelectorAll('span');if(spans.length>=3){var n=Object.keys(map).length,b=spans[2].querySelector('b');if(b)b.textContent=n;var label=n===1?'vůz venku':(n>=2&&n<=4?'vozy venku':'vozů venku'),nodes=spans[2].childNodes;if(nodes.length)nodes[nodes.length-1].nodeValue=' '+label}}}
  function refreshOpenConvoy(){var overlay=document.getElementById('v46Convoy'),open=document.getElementById('v46ConvoyOpen');if(overlay&&overlay.classList.contains('show')&&open){open.click()}}
  function sync(force){var sig=signature();paintFleet();if(force||sig!==lastSig){lastSig=sig;if(typeof renderAll==='function')renderAll();setTimeout(paintFleet,0);setTimeout(paintFleet,120);refreshOpenConvoy()}}
  function bindFirebase(){if(bound||typeof ridesRef==='undefined'||!ridesRef||typeof ridesRef.on!=='function')return;bound=true;ridesRef.on('value',function(){setTimeout(function(){sync(true)},0);setTimeout(function(){sync(true)},120)})}
  function patchRefresh(){if(window.__v46RefreshPatched)return;window.__v46RefreshPatched=true;var old=window.refreshV45;window.refreshV45=function(){try{if(window.parent&&window.parent!==window){window.parent.location.reload();return}}catch(e){}if(typeof old==='function')old();else location.reload()};var b=document.getElementById('v45RefreshBtn');if(b)b.onclick=window.refreshV45}
  window.v46LiveSync=function(){sync(true)};
  setInterval(function(){bindFirebase();patchRefresh();sync(false)},250);
  bindFirebase();patchRefresh();sync(true);
})();
