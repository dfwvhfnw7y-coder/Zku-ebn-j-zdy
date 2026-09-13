/* ── V45 Event selector + safe event management ── */
var _eventUiSig='';

/* V45 prep: remove the cold-start waterfall. Scripts are preloaded while
   presentation styles are attached as real stylesheets so preload detection
   can never suppress the stylesheet itself. */
(function prewarmV45(){
  var assets=[
    ['script','js/app-10-v44-ui.js?v=45'],
    ['script','js/app-11-v44-screens.js?v=45'],
    ['script','js/app-12-v44-polish.js?v=45'],
    ['script','js/app-13-v44-responsive.js?v=45'],
    ['script','js/app-14-v44-fleet.js?v=45'],
    ['script','js/app-15-v44-event-fleet.js?v=45'],
    ['style','css/v44-screens.css?v=45'],
    ['style','css/v44-polish.css?v=45'],
    ['style','css/v44-responsive.css?v=45'],
    ['style','css/v44-fleet.css?v=45'],
    ['style','css/v45.css?v=45']
  ];
  assets.forEach(function(a){
    if(a[0]==='style'){
      if(document.querySelector('link[rel="stylesheet"][href="'+a[1]+'"]'))return;
      var st=document.createElement('link');st.rel='stylesheet';st.href=a[1];document.head.appendChild(st);return;
    }
    if(document.querySelector('link[rel="preload"][href="'+a[1]+'"]'))return;
    var l=document.createElement('link');l.rel='preload';l.href=a[1];l.as='script';document.head.appendChild(l);
  });
})();

/* Fleet is operational data, so start its listener immediately instead of
   waiting for the whole visual-module chain. app-13 detects this marker and
   will not load a second copy. */
(function bootFleetEarly(){
  if(window.__v45FleetEarlyLoading||window.__v45FleetEarlyLoaded)return;
  window.__v45FleetEarlyLoading=true;
  var s=document.createElement('script');s.src='js/app-14-v44-fleet.js?v=45';
  s.onload=function(){window.__v45FleetEarlyLoading=false;window.__v45FleetEarlyLoaded=true};
  s.onerror=function(){window.__v45FleetEarlyLoading=false};
  document.body.appendChild(s);
})();

function sortEventsForPicker(list){return(list||[]).slice().sort(function(a,b){return(new Date(b.createdAt||0).getTime()||0)-(new Date(a.createdAt||0).getTime()||0)})}
function isArchivedEvent(e){return !!(e&&e.status==='archived')}
function eventOption(e){var label=e.name||'Bez názvu';if(e.createdAt){var d=new Date(e.createdAt);if(!isNaN(d.getTime()))label+=' · '+d.toLocaleDateString('cs-CZ')}return '<option value="'+esc(e._key)+'">'+esc(label)+'</option>'}
function activeEventsSorted(){return sortEventsForPicker(events).filter(function(e){return !isArchivedEvent(e)})}
function archivedEventsSorted(){return sortEventsForPicker(events).filter(isArchivedEvent)}

function installEventSelector(){
  var input=document.getElementById('eventName');if(!input||document.getElementById('eventSelect'))return;input.type='hidden';
  var sel=document.createElement('select');sel.id='eventSelect';sel.className='inp';sel.style.cssText='padding:8px 10px;font-size:13px;flex:1;min-width:0';sel.onchange=onEventSelect;input.parentNode.insertBefore(sel,input);
  var refresh=document.createElement('button');refresh.type='button';refresh.className='btn btn-outline btn-sm';refresh.id='v45RefreshBtn';refresh.style.cssText='padding:8px 10px;width:auto';refresh.title='Aktualizovat';refresh.textContent='↻';refresh.onclick=refreshV45;input.parentNode.insertBefore(refresh,input.nextSibling);
  var archive=document.createElement('button');archive.type='button';archive.className='btn btn-outline btn-sm';archive.id='v45ArchiveListBtn';archive.style.cssText='padding:8px 10px;width:auto';archive.title='Archivované akce';archive.textContent='📦';archive.onclick=openArchiveList;input.parentNode.insertBefore(archive,refresh.nextSibling);
  var manage=document.createElement('button');manage.type='button';manage.className='btn btn-outline btn-sm';manage.id='eventManageBtn';manage.style.cssText='padding:8px 10px;width:auto';manage.title='Správa akce';manage.textContent='•••';manage.onclick=openEventManager;input.parentNode.insertBefore(manage,archive.nextSibling);
  var add=document.createElement('button');add.type='button';add.className='btn btn-outline btn-sm';add.style.cssText='padding:8px 10px;width:auto';add.title='Nová akce';add.textContent='＋';add.onclick=createNewEvent;input.parentNode.insertBefore(add,manage.nextSibling);
  installEventManager();installArchiveList();installPullRefresh();renderEventSelector();
}
function installEventManager(){
  if(document.getElementById('v45EventManager'))return;var m=document.createElement('div');m.id='v45EventManager';m.className='v45-event-modal';
  m.innerHTML='<div class="v45-event-sheet"><div class="v45-event-head"><div><small>Správa akce</small><h3 id="v45EventManagerName">Akce</h3></div><button type="button" id="v45EventManagerClose">✕</button></div><div class="v45-event-meta" id="v45EventManagerMeta"></div><button type="button" class="v45-event-action archive" id="v45EventArchive"><span>📦</span><div><strong>Archivovat akci</strong><small>Skryje ji z běžného seznamu, data zůstanou zachována</small></div></button><button type="button" class="v45-event-action restore" id="v45EventRestore"><span>↺</span><div><strong>Obnovit akci</strong><small>Vrátí ji mezi aktivní akce</small></div></button></div>';
  document.body.appendChild(m);document.getElementById('v45EventManagerClose').onclick=closeEventManager;document.getElementById('v45EventArchive').onclick=archiveCurrentEvent;document.getElementById('v45EventRestore').onclick=restoreCurrentEvent;m.onclick=function(e){if(e.target===m)closeEventManager()};
}
function installArchiveList(){
  if(document.getElementById('v45ArchiveList'))return;var m=document.createElement('div');m.id='v45ArchiveList';m.className='v45-event-modal';
  m.innerHTML='<div class="v45-event-sheet"><div class="v45-event-head"><div><small>Archiv</small><h3>Archivované akce</h3></div><button type="button" id="v45ArchiveListClose">✕</button></div><div id="v45ArchiveItems" class="v45-archive-items"></div></div>';
  document.body.appendChild(m);document.getElementById('v45ArchiveListClose').onclick=closeArchiveList;m.onclick=function(e){if(e.target===m)closeArchiveList()};renderArchiveList();
}
function renderArchiveList(){
  var box=document.getElementById('v45ArchiveItems'),btn=document.getElementById('v45ArchiveListBtn'),list=archivedEventsSorted();if(btn){btn.classList.toggle('has-items',!!list.length);btn.title=list.length?'Archivované akce ('+list.length+')':'Archivované akce'}if(!box)return;
  if(!list.length){box.innerHTML='<div class="v45-archive-empty">Archiv je prázdný.</div>';return}
  var h='';for(var i=0;i<list.length;i++){var e=list[i],d=e.createdAt?new Date(e.createdAt):null,date=d&&!isNaN(d.getTime())?d.toLocaleDateString('cs-CZ'):'';h+='<div class="v45-archive-row"><div><strong>'+esc(e.name||'Akce')+'</strong><small>'+esc(date)+'</small></div><button type="button" data-restore-event="'+esc(e._key)+'">↺ Obnovit</button></div>'}box.innerHTML=h;
  var bs=box.querySelectorAll('[data-restore-event]');for(var j=0;j<bs.length;j++)bs[j].onclick=function(){restoreArchivedEvent(this.getAttribute('data-restore-event'))};
}
function openArchiveList(){renderArchiveList();var m=document.getElementById('v45ArchiveList');if(m)m.classList.add('show')}
function closeArchiveList(){var m=document.getElementById('v45ArchiveList');if(m)m.classList.remove('show')}
function openEventManager(){var e=eventById(currentEventId),m=document.getElementById('v45EventManager');if(!e||!m){flash('Nejdřív vyber akci',true);return}document.getElementById('v45EventManagerName').textContent=e.name||'Akce';document.getElementById('v45EventManagerMeta').textContent=isArchivedEvent(e)?'Archivovaná akce · pouze pro prohlížení':'Aktivní akce';document.getElementById('v45EventArchive').style.display=isArchivedEvent(e)?'none':'flex';document.getElementById('v45EventRestore').style.display=isArchivedEvent(e)?'flex':'none';m.classList.add('show')}
function closeEventManager(){var m=document.getElementById('v45EventManager');if(m)m.classList.remove('show')}
function activeCurrentEventRides(){try{return typeof getActiveRides==='function'?getActiveRides():[]}catch(e){return[]}}
function archiveCurrentEvent(){
  var e=eventById(currentEventId);if(!e)return;var active=activeCurrentEventRides();if(active.length){flash('Akci nelze archivovat: stále probíhá '+active.length+' jízd.',true);return}
  if(!confirm('Archivovat akci „'+(e.name||'')+'“?\n\nJízdy, zákazníci i vozidla zůstanou zachované.'))return;
  var patch={status:'archived',archivedAt:new Date().toISOString()},save=(fbReady&&db)?db.ref('events/'+e._key).update(patch):fbRest('PATCH','events/'+e._key,patch);
  Promise.resolve(save).then(function(){e.status='archived';e.archivedAt=patch.archivedAt;pendingCustomer=null;closeEventManager();renderEventSelector();renderArchiveList();var next=activeEventsSorted()[0];selectEventById(next?next._key:'',false);flash('📦 Akce archivována')}).catch(function(err){flash('Archivaci se nepodařilo uložit: '+(err&&err.message?err.message:err),true)});
}
function restoreArchivedEvent(id){
  var e=eventById(id);if(!e||!isArchivedEvent(e))return;var patch={status:'active',archivedAt:null},save=(fbReady&&db)?db.ref('events/'+e._key).update(patch):fbRest('PATCH','events/'+e._key,patch);
  Promise.resolve(save).then(function(){e.status='active';e.archivedAt=null;closeArchiveList();closeEventManager();renderEventSelector();renderArchiveList();selectEventById(e._key,false);flash('↺ Akce obnovena: '+(e.name||''))}).catch(function(err){flash('Obnovení se nepodařilo uložit: '+(err&&err.message?err.message:err),true)});
}
function restoreCurrentEvent(){var e=eventById(currentEventId);if(e)restoreArchivedEvent(e._key)}
function renderEventSelector(){
  var sel=document.getElementById('eventSelect');if(!sel)return;var sorted=sortEventsForPicker(events),active=[],name=getEventName(),hasCurrent=false,currentArchived=false;
  for(var i=0;i<sorted.length;i++){var e=sorted[i];if(e._key===currentEventId){hasCurrent=true;currentArchived=isArchivedEvent(e)}if(!isArchivedEvent(e))active.push(e)}
  if(currentEventId&&name&&!hasCurrent)active.unshift({_key:currentEventId,name:name,createdAt:'',status:'local'});
  var h='<option value="">Vyber akci…</option>';if(active.length){h+='<optgroup label="Aktivní akce">';for(var a=0;a<active.length;a++)h+=eventOption(active[a]);h+='</optgroup>'}sel.innerHTML=h;
  if(currentArchived){var fallback=active[0]||null;currentEventId=fallback?fallback._key:'';document.getElementById('eventName').value=fallback?(fallback.name||''):'';persistEventSelection(fallback?(fallback.name||''):'',currentEventId)}
  if(currentEventId){sel.value=currentEventId}else{var legacy=eventByName(name);if(legacy&&!isArchivedEvent(legacy)){selectEventById(legacy._key,false);sel.value=legacy._key}}
  var manage=document.getElementById('eventManageBtn');if(manage)manage.disabled=!currentEventId;renderArchiveList();
}
function clearTransientEventUi(){if(typeof pendingCustomer!=='undefined')pendingCustomer=null;if(typeof pendingConfirm!=='undefined')pendingConfirm=null;var confirmEl=document.getElementById('confirmOverlay');if(confirmEl)confirmEl.classList.remove('show');var scanEl=document.getElementById('scanOverlay');if(scanEl&&scanEl.classList.contains('show')&&typeof closeScan==='function')closeScan();var pickEl=document.getElementById('cpickOverlay');if(pickEl)pickEl.classList.remove('show');if(typeof window.v44CardPrintMode!=='undefined')window.v44CardPrintMode=false}
function goSelectedEvent(e){if(typeof switchTab==='function')switchTab(isArchivedEvent(e)?'log':'scan');try{window.scrollTo({top:0,behavior:'smooth'})}catch(x){window.scrollTo(0,0)}}
function selectEventById(id,notify){
  var previousId=currentEventId||'',e=eventById(id);if(!e&&id===currentEventId&&getEventName())e={_key:id,name:getEventName(),createdAt:'',status:'local'};
  if(e&&isArchivedEvent(e)){openArchiveList();if(notify!==false)flash('📦 Archivovanou akci nejdřív obnovte.',true);return}
  if(!e){if(previousId)clearTransientEventUi();currentEventId='';document.getElementById('eventName').value='';persistEventSelection('','');if(window.renderV44State)renderV44State();goSelectedEvent(null);if(notify!==false)flash('Vyber akci',true);return}
  if(previousId&&previousId!==e._key)clearTransientEventUi();currentEventId=e._key;document.getElementById('eventName').value=e.name||'';persistEventSelection(e.name||'',e._key);clearEventWarn();if(notify!==false)flash('📋 Akce: '+(e.name||''));renderAll();if(window.renderV44State)renderV44State();goSelectedEvent(e);var picker=document.getElementById('cpickOverlay');if(picker&&picker.classList.contains('show'))renderCustomerPicker();
}
function onEventSelect(){selectEventById(document.getElementById('eventSelect').value,true)}
function createNewEvent(){var name=prompt('Název nové akce:');if(name===null)return;name=name.trim();if(!name){flash('Název akce je povinný',true);return}clearTransientEventUi();var id=newEventId(),obj={name:name,createdAt:new Date().toISOString(),status:'active'};currentEventId=id;document.getElementById('eventName').value=name;persistEventSelection(name,id);events.push({_key:id,name:obj.name,createdAt:obj.createdAt,status:obj.status});renderEventSelector();document.getElementById('eventSelect').value=id;clearEventWarn();if(window.renderV44State)renderV44State();goSelectedEvent(obj);var save=(fbReady&&db)?db.ref('events/'+id).set(obj):fbRest('PUT','events/'+id,obj);Promise.resolve(save).then(function(){flash('✅ Nová akce uložena: '+name)}).catch(function(err){flash('Akci se nepodařilo uložit: '+(err&&err.message?err.message:err),true)})}
function warnEvent(){var el=document.getElementById('eventSelect')||document.getElementById('eventName');if(el){el.classList.remove('needEvent');void el.offsetWidth;el.classList.add('needEvent');try{el.focus()}catch(e){}}flash('⚠ Nejdřív vyber akci',true)}
function clearEventWarn(){var el=document.getElementById('eventSelect')||document.getElementById('eventName');if(el)el.classList.remove('needEvent')}

function refreshV45(){
  if(window.__v45Refreshing)return;window.__v45Refreshing=true;var b=document.getElementById('v45RefreshBtn');if(b){b.classList.add('is-refreshing');b.disabled=true}flash('↻ Aktualizuji data…');
  /* A real reconnect is deliberate here: it refreshes rides, customers,
     events and the event-scoped vehicle listener in one predictable step. */
  setTimeout(function(){location.reload()},120);
}
function installPullRefresh(){
  if(window.__v45PullInstalled)return;window.__v45PullInstalled=true;var startY=0,pull=0,tracking=false,ind=document.createElement('div');ind.id='v45PullRefresh';ind.textContent='↻ Potáhněte pro aktualizaci';document.body.appendChild(ind);
  document.addEventListener('touchstart',function(e){if(window.scrollY<=0&&e.touches&&e.touches.length===1){startY=e.touches[0].clientY;pull=0;tracking=true}},{passive:true});
  document.addEventListener('touchmove',function(e){if(!tracking||!e.touches||!e.touches.length)return;var d=e.touches[0].clientY-startY;if(d<=0){pull=0;ind.classList.remove('show','ready');return}pull=Math.min(110,d);if(pull>18)ind.classList.add('show');ind.classList.toggle('ready',pull>=72);ind.textContent=pull>=72?'↻ Pusťte pro aktualizaci':'↻ Potáhněte pro aktualizaci'},{passive:true});
  document.addEventListener('touchend',function(){if(!tracking)return;tracking=false;ind.classList.remove('show','ready');if(pull>=72)refreshV45();pull=0},{passive:true});
}
window.refreshV45=refreshV45;

installEventSelector();
setInterval(function(){var sig=events.map(function(e){return e._key+':'+(e.name||'')+':'+(e.createdAt||'')+':'+(e.status||'')}).join('|')+'|current:'+currentEventId+'|name:'+getEventName();if(sig!==_eventUiSig){_eventUiSig=sig;renderEventSelector()}},500);

/* V44/V45 visual modules load after the functional modules. */
(function(){function load(src,done){var s=document.createElement('script');s.src=src+'?v=45';s.onload=done||null;document.body.appendChild(s)}load('js/app-10-v44-ui.js',function(){load('js/app-11-v44-screens.js')})})();
