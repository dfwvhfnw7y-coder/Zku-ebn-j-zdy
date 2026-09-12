/* ── v43 Event selector ── */
function sortEventsForPicker(list){
  return (list||[]).slice().sort(function(a,b){
    return (new Date(b.createdAt||0).getTime()||0)-(new Date(a.createdAt||0).getTime()||0);
  });
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
    currentEventId='';
    document.getElementById('eventName').value='';
    persistEventSelection('','');
    if(notify!==false)flash('Vyber akci',true);
    return;
  }
  currentEventId=e._key;
  document.getElementById('eventName').value=e.name||'';
  persistEventSelection(e.name||'',e._key);
  clearEventWarn();
  if(notify!==false)flash('📋 Akce: '+(e.name||''));
  renderAll();
  if(document.getElementById('cpickOverlay').classList.contains('show'))renderCustomerPicker();
}
function onEventSelect(){selectEventById(document.getElementById('eventSelect').value,true)}
function createNewEvent(){
  var name=prompt('Název nové akce:');
  if(name===null)return;
  name=name.trim();
  if(!name){flash('Název akce je povinný',true);return}
  var id=newEventId(),obj={name:name,createdAt:new Date().toISOString(),status:'active'};
  events.push({_key:id,name:obj.name,createdAt:obj.createdAt,status:obj.status});
  currentEventId=id;
  document.getElementById('eventName').value=name;
  persistEventSelection(name,id);
  if(fbReady&&db)db.ref('events/'+id).set(obj);else fbRest('PUT','events/'+id,obj);
  renderEventSelector();
  document.getElementById('eventSelect').value=id;
  clearEventWarn();
  flash('✅ Nová akce: '+name);
}
setTimeout(renderEventSelector,0);
