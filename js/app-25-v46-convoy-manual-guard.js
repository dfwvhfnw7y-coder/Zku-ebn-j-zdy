/* V46: while a convoy is running, do not offer/allow normal customer-to-car takeover for convoy cars */
(function(){
  function norm(s){return String(s||'').trim().toLowerCase()}
  function eid(){return typeof getCurrentEventId==='function'?getCurrentEventId():''}
  function ev(){return typeof getEventName==='function'?getEventName():''}
  function inEvent(r){var id=eid();return id&&r&&r.eventId?r.eventId===id:(r&&r.event||'')===ev()}
  function convoyRide(car){if(typeof rides==='undefined'||!Array.isArray(rides))return null;var best=null;for(var i=0;i<rides.length;i++){var r=rides[i];if(!r||r.end||!r.convoy||!inEvent(r)||norm(r.car)!==norm(car))continue;if(!best||new Date(r.start||0)>new Date(best.start||0))best=r}return best}
  function apply(){var grid=document.getElementById('v44FleetGrid');if(!grid)return;var hasPending=typeof pendingCustomer!=='undefined'&&!!pendingCustomer;var cards=grid.querySelectorAll('.v44-vehicle');for(var i=0;i<cards.length;i++){var card=cards[i],nameEl=card.querySelector('.v44-vehicle-name'),btn=card.querySelector('.v44-fleet-start'),note=card.querySelector('.v46-convoy-manual-note');if(!nameEl)continue;var active=!!convoyRide(nameEl.textContent);if(btn)btn.style.display=(hasPending&&active)?'none':'';if(hasPending&&active){if(!note){note=document.createElement('div');note.className='v44-fleet-driver v46-convoy-manual-note';note.textContent='📡 Součást kolony · přidání cestujícího řeš v režimu Kolona';var info=card.querySelector('.v44-vehicle-info');if(info)info.insertBefore(note,info.querySelector('.v44-vehicle-actions'))}}else if(note&&note.parentNode)note.parentNode.removeChild(note)}}
  function guardAssign(){if(window.__v46ConvoyAssignGuard||typeof window.assignPendingCustomerToCar!=='function')return;window.__v46ConvoyAssignGuard=true;var old=window.assignPendingCustomerToCar;window.assignPendingCustomerToCar=function(car){if(convoyRide(car)){if(typeof flash==='function')flash('📡 '+car+' je součást aktivní kolony. Cestujícího přidej v režimu Kolona.',true);return false}return old.apply(this,arguments)}}
  function installObserver(){var grid=document.getElementById('v44FleetGrid');if(!grid||grid.__v46ConvoyGuardObserved)return;if(typeof MutationObserver==='undefined')return;grid.__v46ConvoyGuardObserved=true;new MutationObserver(function(){apply()}).observe(grid,{childList:true,subtree:true})}
  function refresh(){guardAssign();installObserver();apply()}
  document.addEventListener('v46:sync',refresh);
  document.addEventListener('click',function(e){var b=e.target&&e.target.closest?e.target.closest('.v44-fleet-start'):null;if(!b)return;var card=b.closest('.v44-vehicle'),name=card&&card.querySelector('.v44-vehicle-name');if(name&&convoyRide(name.textContent)){e.preventDefault();e.stopImmediatePropagation();if(typeof flash==='function')flash('📡 Toto vozidlo jede v koloně. Přidání cestujícího proveď v režimu Kolona.',true)}},true);
  setTimeout(refresh,100);setTimeout(refresh,700);
})();
