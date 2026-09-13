/* V46 hotfix: convoy card selection + duplicate-safe views/start guard */
(function(){
 function norm(s){return String(s||'').trim().toLowerCase()}
 function dedupe(list){var out=[],seen={};for(var i=0;i<(list||[]).length;i++){var r=list[i];if(!r)continue;var k=r._key||[r.car,r.start,r.end||''].join('|');if(seen[k])continue;seen[k]=1;out.push(r)}return out}
 function currentEventRide(r){if(typeof getCurrentEventId==='function'){var eid=getCurrentEventId();if(eid&&r.eventId)return r.eventId===eid}var ev=typeof getEventName==='function'?getEventName():'';return !ev||r.event===ev}
 function activeCar(name){if(typeof rides==='undefined'||!Array.isArray(rides))return null;name=norm(name);for(var i=0;i<rides.length;i++){var r=rides[i];if(r&&!r.end&&currentEventRide(r)&&norm(r.car)===name)return r}return null}
 function cleanupGlobal(){if(typeof rides==='undefined'||!Array.isArray(rides))return;var d=dedupe(rides);if(d.length!==rides.length){rides.splice(0,rides.length);Array.prototype.push.apply(rides,d);if(typeof renderAll==='function')renderAll()}}
 function patchLists(){
   if(typeof window.getActiveRides==='function'&&!window.__v46DedupeActive){var oldA=window.getActiveRides;window.getActiveRides=function(){return dedupe(oldA.apply(this,arguments))};window.__v46DedupeActive=true}
   if(typeof window.getEventRides==='function'&&!window.__v46DedupeEvent){var oldE=window.getEventRides;window.getEventRides=function(){return dedupe(oldE.apply(this,arguments))};window.__v46DedupeEvent=true}
 }
 function patchCards(){var box=document.getElementById('v46Cars');if(!box||box.__v46Clickable)return;box.__v46Clickable=true;box.addEventListener('click',function(e){if(e.target.closest('button'))return;var card=e.target.closest('.v46-car');if(!card)return;var cards=Array.prototype.slice.call(box.querySelectorAll('.v46-car')),i=cards.indexOf(card);if(i>=0&&typeof window.v46ChooseCrew==='function')window.v46ChooseCrew(i)})}
 function markCards(){var cards=document.querySelectorAll('#v46Cars .v46-car');for(var i=0;i<cards.length;i++){cards[i].style.cursor='pointer';if(!cards[i].querySelector('.v46-card-hint')){var h=document.createElement('div');h.className='v46-card-hint';h.textContent='Klikni pro úpravu posádky';h.style.cssText='margin-top:8px;font-size:12px;color:#7f98a6';cards[i].appendChild(h)}}}
 function patchStartGuard(){var b=document.getElementById('v46Start');if(!b||b.__v46Guard)return;b.__v46Guard=true;b.addEventListener('click',function(e){var names=[],els=document.querySelectorAll('#v46Cars .v46-car strong');for(var i=0;i<els.length;i++)names.push(els[i].textContent);for(var j=0;j<names.length;j++){if(activeCar(names[j])){e.preventDefault();e.stopImmediatePropagation();if(typeof flash==='function')flash('⚠️ '+names[j]+' už má aktivní jízdu. Nejdřív ji ukonči.',true);return false}}},true)}
 function tick(){cleanupGlobal();patchLists();patchCards();patchStartGuard();markCards()}
 setInterval(tick,300);tick();
})();
