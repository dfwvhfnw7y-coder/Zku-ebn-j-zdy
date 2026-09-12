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
  var list=sortEventsForPicker(events),h='<option value="">Vyber akci…</option>';
  for(var i=0;i<list.length;i++){
    var e=list[i],label=e.name||'Bez názvu';
    if(e.createdAt){var d=new Date(e.createdAt);if(!isNaN(d.getTime()))label+=' · '+d.toLocaleDateString('cs-CZ')}
    h+='<option value="'+esc(e._key)+'">'+esc(label)+'</option>';
  }
  sel.innerHTML=h;
  if(currentEventId&&eventById(currentEventId))sel.value=currentEventId;
  else{
    var name=getEventName(),legacy=eventByName(name);
    if(legacy){selectEventById(legacy._key,false);sel.value=legacy._key}
  }
}
function selectEventById(id,notify){
  var e=eventById(id);
  if(!e){
    currentEventId='';document.getElementById('eventName').value='';persistEventSelection('','');
    if(notify!==false)flash('Vyber akci',true);return;
  }
  currentEventId=e._key;document.getElementById('eventName').value=e.name||'';persistEventSelection(e.name||'',e._key);
  clearEventWarn();if(notify!==false)flash('📋 Akce: '+(e.name||''));renderAll();
  if(document.getElementById('cpickOverlay').classList.contains('show'))renderCustomerPicker();
}
function onEventSelect(){selectEventById(document.getElementById('eventSelect').value,true)}
function createNewEvent(){
  var name=prompt('Název nové akce:');if(name===null)return;name=name.trim();
  if(!name){flash('Název akce je povinný',true);return}
  var id=newEventId(),obj={name:name,createdAt:new Date().toISOString(),status:'active'};
  events.push({_key:id,name:obj.name,createdAt:obj.createdAt,status:obj.status});currentEventId=id;
  document.getElementById('eventName').value=name;persistEventSelection(name,id);
  if(fbReady&&db)db.ref('events/'+id).set(obj);else fbRest('PUT','events/'+id,obj);
  renderEventSelector();document.getElementById('eventSelect').value=id;clearEventWarn();flash('✅ Nová akce: '+name);
}
function warnEvent(){
  var el=document.getElementById('eventSelect')||document.getElementById('eventName');
  if(el){el.classList.remove('needEvent');void el.offsetWidth;el.classList.add('needEvent');try{el.focus()}catch(e){}}
  flash('⚠ Nejdřív vyber akci',true);
}
function clearEventWarn(){var el=document.getElementById('eventSelect')||document.getElementById('eventName');if(el)el.classList.remove('needEvent')}
installEventSelector();
setInterval(function(){
  var sig=events.map(function(e){return e._key+':'+(e.name||'')+':'+(e.createdAt||'')}).join('|');
  if(sig!==_eventUiSig){_eventUiSig=sig;renderEventSelector()}
},750);
