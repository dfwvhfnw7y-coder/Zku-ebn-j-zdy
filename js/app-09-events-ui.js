/* ── v43 Event selector ── */
var _eventUiSig='';
function sortEventsForPicker(list){
  return (list||[]).slice().sort(function(a,b){
    return (new Date(b.createdAt||0).getTime()||0)-(new Date(a.createdAt||0).getTime()||0);
  });
}
function installEventSelector(){
  var input=document.getElementById('eventName');
  if(!input||document.getElementById('eventSelect'))return;
  input.type='hidden';
  var sel=document.createElement('select');
  sel.id='eventSelect';sel.className='inp';sel.style.cssText='padding:8px 10px;font-size:13px;flex:1;min-width:0';sel.onchange=onEventSelect;
  input.parentNode.insertBefore(sel,input);
  var add=document.createElement('button');
  add.type='button';add.className='btn btn-outline btn-sm';add.style.cssText='padding:8px 10px;width:auto';add.title='Nová akce';add.textContent='＋';add.onclick=createNewEvent;
  input.parentNode.insertBefore(add,input.nextSibling);
  renderEventSelector();
}
function renderEventSelector(){
  var sel=document.getElementById('eventSelect');
  if(!sel)return;
  var list=sortEventsForPicker(events),name=getEventName(),hasCurrent=false;
  for(var z=0;z<list.length;z++)if(list[z]._key===currentEventId){hasCurrent=true;break}
  /* Po refreshi zobrazíme poslední vybranou akci hned, i než dorazí Firebase snapshot. */
  if(currentEventId&&name&&!hasCurrent)list.unshift({_key:currentEventId,name:name,createdAt:'',status:'local'});
  var h='<option value="">Vyber akci…</option>';
  for(var i=0;i<list.length;i++){
    var e=list[i],label=e.name||'Bez názvu';
    if(e.createdAt){var d=new Date(e.createdAt);if(!isNaN(d.getTime()))label+=' · '+d.toLocaleDateString('cs-CZ')}
    h+='<option value="'+esc(e._key)+'">'+esc(label)+'</option>';
  }
  sel.innerHTML=h;
  if(currentEventId){sel.value=currentEventId}
  else{
    var legacy=eventByName(name);
    if(legacy){selectEventById(legacy._key,false);sel.value=legacy._key}
  }
}
function clearTransientEventUi(){
  if(typeof pendingCustomer!=='undefined')pendingCustomer=null;
  if(typeof pendingConfirm!=='undefined')pendingConfirm=null;
  var confirmEl=document.getElementById('confirmOverlay');if(confirmEl)confirmEl.classList.remove('show');
  var scanEl=document.getElementById('scanOverlay');if(scanEl&&scanEl.classList.contains('show')&&typeof closeScan==='function')closeScan();
  var pickEl=document.getElementById('cpickOverlay');if(pickEl)pickEl.classList.remove('show');
  if(typeof window.v44CardPrintMode!=='undefined')window.v44CardPrintMode=false;
}
function goHome(){if(typeof switchTab==='function')switchTab('scan');try{window.scrollTo({top:0,behavior:'smooth'})}catch(e){window.scrollTo(0,0)}}
function selectEventById(id,notify){
  var previousId=currentEventId||'';
  var e=eventById(id);
  /* U právě obnovené stránky může být vybraná akce zatím jen v localStorage. */
  if(!e&&id===currentEventId&&getEventName())e={_key:id,name:getEventName(),createdAt:'',status:'local'};
  if(!e){
    if(previousId)clearTransientEventUi();
    currentEventId='';document.getElementById('eventName').value='';persistEventSelection('','');
    if(window.renderV44State)renderV44State();
    goHome();
    if(notify!==false)flash('Vyber akci',true);return;
  }
  if(previousId&&previousId!==e._key)clearTransientEventUi();
  currentEventId=e._key;document.getElementById('eventName').value=e.name||'';persistEventSelection(e.name||'',e._key);
  clearEventWarn();if(notify!==false)flash('📋 Akce: '+(e.name||''));renderAll();
  if(window.renderV44State)renderV44State();
  goHome();
  var picker=document.getElementById('cpickOverlay');if(picker&&picker.classList.contains('show'))renderCustomerPicker();
}
function onEventSelect(){selectEventById(document.getElementById('eventSelect').value,true)}
function createNewEvent(){
  var name=prompt('Název nové akce:');if(name===null)return;name=name.trim();
  if(!name){flash('Název akce je povinný',true);return}
  clearTransientEventUi();
  var id=newEventId(),obj={name:name,createdAt:new Date().toISOString(),status:'active'};
  currentEventId=id;document.getElementById('eventName').value=name;persistEventSelection(name,id);
  events.push({_key:id,name:obj.name,createdAt:obj.createdAt,status:obj.status});
  renderEventSelector();document.getElementById('eventSelect').value=id;clearEventWarn();if(window.renderV44State)renderV44State();goHome();
  var save=(fbReady&&db)?db.ref('events/'+id).set(obj):fbRest('PUT','events/'+id,obj);
  Promise.resolve(save).then(function(){flash('✅ Nová akce uložena: '+name)}).catch(function(err){flash('Akci se nepodařilo uložit: '+(err&&err.message?err.message:err),true)});
}
function warnEvent(){
  var el=document.getElementById('eventSelect')||document.getElementById('eventName');
  if(el){el.classList.remove('needEvent');void el.offsetWidth;el.classList.add('needEvent');try{el.focus()}catch(e){}}
  flash('⚠ Nejdřív vyber akci',true);
}
function clearEventWarn(){var el=document.getElementById('eventSelect')||document.getElementById('eventName');if(el)el.classList.remove('needEvent')}
installEventSelector();
setInterval(function(){
  var sig=events.map(function(e){return e._key+':'+(e.name||'')+':'+(e.createdAt||'')}).join('|')+'|current:'+currentEventId+'|name:'+getEventName();
  if(sig!==_eventUiSig){_eventUiSig=sig;renderEventSelector()}
},500);

/* v44: visual modules load after the functional v43 modules. */
(function(){
  function load(src,done){var s=document.createElement('script');s.src=src+'?v=44';s.onload=done||null;document.body.appendChild(s)}
  load('js/app-10-v44-ui.js',function(){load('js/app-11-v44-screens.js')});
})();
