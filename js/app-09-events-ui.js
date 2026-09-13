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

function sortEventsForPicker(list){return(list||[]).slice().sort(function(a,b){return(new Date(b.createdAt||0).getTime()||0)-(new Date(a.createdAt||0).getTime()||0)})}
function isArchivedEvent(e){return !!(e&&e.status==='archived')}
function eventOption(e){var label=e.name||'Bez názvu';if(e.createdAt){var d=new Date(e.createdAt);if(!isNaN(d.getTime()))label+=' · '+d.toLocaleDateString('cs-CZ')}return '<option value="'+esc(e._key)+'">'+esc(label)+'</option>'}
function installEventSelector(){
  var input=document.getElementById('eventName');if(!input||document.getElementById('eventSelect'))return;input.type='hidden';
  var sel=document.createElement('select');sel.id='eventSelect';sel.className='inp';sel.style.cssText='padding:8px 10px;font-size:13px;flex:1;min-width:0';sel.onchange=onEventSelect;input.parentNode.insertBefore(sel,input);
  var manage=document.createElement('button');manage.type='button';manage.className='btn btn-outline btn-sm';manage.id='eventManageBtn';manage.style.cssText='padding:8px 10px;width:auto';manage.title='Správa akce';manage.textContent='•••';manage.onclick=openEventManager;input.parentNode.insertBefore(manage,input.nextSibling);
  var add=document.createElement('button');add.type='button';add.className='btn btn-outline btn-sm';add.style.cssText='padding:8px 10px;width:auto';add.title='Nová akce';add.textContent='＋';add.onclick=createNewEvent;input.parentNode.insertBefore(add,manage.nextSibling);
  installEventManager();renderEventSelector();
}
function installEventManager(){
  if(document.getElementById('v45EventManager'))return;var m=document.createElement('div');m.id='v45EventManager';m.className='v45-event-modal';
  m.innerHTML='<div class="v45-event-sheet"><div class="v45-event-head"><div><small>Správa akce</small><h3 id="v45EventManagerName">Akce</h3></div><button type="button" id="v45EventManagerClose">✕</button></div><div class="v45-event-meta" id="v45EventManagerMeta"></div><button type="button" class="v45-event-action archive" id="v45EventArchive"><span>📦</span><div><strong>Archivovat akci</strong><small>Skryje ji z běžného seznamu, data zůstanou zachována</small></div></button><button type="button" class="v45-event-action restore" id="v45EventRestore"><span>↺</span><div><strong>Obnovit akci</strong><small>Vrátí ji mezi aktivní akce</small></div></button></div>';
  document.body.appendChild(m);document.getElementById('v45EventManagerClose').onclick=closeEventManager;document.getElementById('v45EventArchive').onclick=archiveCurrentEvent;document.getElementById('v45EventRestore').onclick=restoreCurrentEvent;m.onclick=function(e){if(e.target===m)closeEventManager()};
}
function openEventManager(){var e=eventById(currentEventId),m=document.getElementById('v45EventManager');if(!e||!m){flash('Nejdřív vyber akci',true);return}document.getElementById('v45EventManagerName').textContent=e.name||'Akce';document.getElementById('v45EventManagerMeta').textContent=isArchivedEvent(e)?'Archivovaná akce · pouze pro prohlížení':'Aktivní akce';document.getElementById('v45EventArchive').style.display=isArchivedEvent(e)?'none':'flex';document.getElementById('v45EventRestore').style.display=isArchivedEvent(e)?'flex':'none';m.classList.add('show')}
function closeEventManager(){var m=document.getElementById('v45EventManager');if(m)m.classList.remove('show')}
function activeCurrentEventRides(){try{return typeof getActiveRides==='function'?getActiveRides():[]}catch(e){return[]}}
function archiveCurrentEvent(){
  var e=eventById(currentEventId);if(!e)return;var active=activeCurrentEventRides();if(active.length){flash('Akci nelze archivovat: stále probíhá '+active.length+' jízd.',true);return}
  if(!confirm('Archivovat akci „'+(e.name||'')+'“?\n\nJízdy, zákazníci i vozidla zůstanou zachované.'))return;
  var patch={status:'archived',archivedAt:new Date().toISOString()},save=(fbReady&&db)?db.ref('events/'+e._key).update(patch):fbRest('PATCH','events/'+e._key,patch);
  Promise.resolve(save).then(function(){e.status='archived';e.archivedAt=patch.archivedAt;pendingCustomer=null;closeEventManager();renderEventSelector();if(window.renderV44State)renderV44State();goSelectedEvent(e);flash('📦 Akce archivována')}).catch(function(err){flash('Archivaci se nepodařilo uložit: '+(err&&err.message?err.message:err),true)});
}
function restoreCurrentEvent(){
  var e=eventById(currentEventId);if(!e)return;var patch={status:'active',archivedAt:null},save=(fbReady&&db)?db.ref('events/'+e._key).update(patch):fbRest('PATCH','events/'+e._key,patch);
  Promise.resolve(save).then(function(){e.status='active';e.archivedAt=null;closeEventManager();renderEventSelector();goSelectedEvent(e);flash('↺ Akce obnovena')}).catch(function(err){flash('Obnovení se nepodařilo uložit: '+(err&&err.message?err.message:err),true)});
}
function renderEventSelector(){
  var sel=document.getElementById('eventSelect');if(!sel)return;var sorted=sortEventsForPicker(events),active=[],archived=[],name=getEventName(),hasCurrent=false;
  for(var i=0;i<sorted.length;i++){var e=sorted[i];if(e._key===currentEventId)hasCurrent=true;(isArchivedEvent(e)?archived:active).push(e)}
  if(currentEventId&&name&&!hasCurrent)active.unshift({_key:currentEventId,name:name,createdAt:'',status:'local'});
  var h='<option value="">Vyber akci…</option>';if(active.length){h+='<optgroup label="Aktivní akce">';for(var a=0;a<active.length;a++)h+=eventOption(active[a]);h+='</optgroup>'}if(archived.length){h+='<optgroup label="Archivované">';for(var z=0;z<archived.length;z++)h+=eventOption(archived[z]);h+='</optgroup>'}sel.innerHTML=h;
  if(currentEventId){sel.value=currentEventId}else{var legacy=eventByName(name);if(legacy){selectEventById(legacy._key,false);sel.value=legacy._key}}var manage=document.getElementById('eventManageBtn');if(manage)manage.disabled=!currentEventId;
}
function clearTransientEventUi(){if(typeof pendingCustomer!=='undefined')pendingCustomer=null;if(typeof pendingConfirm!=='undefined')pendingConfirm=null;var confirmEl=document.getElementById('confirmOverlay');if(confirmEl)confirmEl.classList.remove('show');var scanEl=document.getElementById('scanOverlay');if(scanEl&&scanEl.classList.contains('show')&&typeof closeScan==='function')closeScan();var pickEl=document.getElementById('cpickOverlay');if(pickEl)pickEl.classList.remove('show');if(typeof window.v44CardPrintMode!=='undefined')window.v44CardPrintMode=false}
function goSelectedEvent(e){if(typeof switchTab==='function')switchTab(isArchivedEvent(e)?'log':'scan');try{window.scrollTo({top:0,behavior:'smooth'})}catch(x){window.scrollTo(0,0)}}
function selectEventById(id,notify){
  var previousId=currentEventId||'',e=eventById(id);if(!e&&id===currentEventId&&getEventName())e={_key:id,name:getEventName(),createdAt:'',status:'local'};
  if(!e){if(previousId)clearTransientEventUi();currentEventId='';document.getElementById('eventName').value='';persistEventSelection('','');if(window.renderV44State)renderV44State();goSelectedEvent(null);if(notify!==false)flash('Vyber akci',true);return}
  if(previousId&&previousId!==e._key)clearTransientEventUi();currentEventId=e._key;document.getElementById('eventName').value=e.name||'';persistEventSelection(e.name||'',e._key);clearEventWarn();if(notify!==false)flash((isArchivedEvent(e)?'📦 Archiv: ':'📋 Akce: ')+(e.name||''));renderAll();if(window.renderV44State)renderV44State();goSelectedEvent(e);var picker=document.getElementById('cpickOverlay');if(picker&&picker.classList.contains('show'))renderCustomerPicker();
}
function onEventSelect(){selectEventById(document.getElementById('eventSelect').value,true)}
function createNewEvent(){var name=prompt('Název nové akce:');if(name===null)return;name=name.trim();if(!name){flash('Název akce je povinný',true);return}clearTransientEventUi();var id=newEventId(),obj={name:name,createdAt:new Date().toISOString(),status:'active'};currentEventId=id;document.getElementById('eventName').value=name;persistEventSelection(name,id);events.push({_key:id,name:obj.name,createdAt:obj.createdAt,status:obj.status});renderEventSelector();document.getElementById('eventSelect').value=id;clearEventWarn();if(window.renderV44State)renderV44State();goSelectedEvent(obj);var save=(fbReady&&db)?db.ref('events/'+id).set(obj):fbRest('PUT','events/'+id,obj);Promise.resolve(save).then(function(){flash('✅ Nová akce uložena: '+name)}).catch(function(err){flash('Akci se nepodařilo uložit: '+(err&&err.message?err.message:err),true)})}
function warnEvent(){var el=document.getElementById('eventSelect')||document.getElementById('eventName');if(el){el.classList.remove('needEvent');void el.offsetWidth;el.classList.add('needEvent');try{el.focus()}catch(e){}}flash('⚠ Nejdřív vyber akci',true)}
function clearEventWarn(){var el=document.getElementById('eventSelect')||document.getElementById('eventName');if(el)el.classList.remove('needEvent')}
installEventSelector();
setInterval(function(){var sig=events.map(function(e){return e._key+':'+(e.name||'')+':'+(e.createdAt||'')+':'+(e.status||'')}).join('|')+'|current:'+currentEventId+'|name:'+getEventName();if(sig!==_eventUiSig){_eventUiSig=sig;renderEventSelector()}},500);

/* V44/V45 visual modules load after the functional modules. */
(function(){function load(src,done){var s=document.createElement('script');s.src=src+'?v=45';s.onload=done||null;document.body.appendChild(s)}load('js/app-10-v44-ui.js',function(){load('js/app-11-v44-screens.js')})})();
