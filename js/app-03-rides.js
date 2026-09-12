/* ── UI ── */
function switchTab(id){
  var p=['Scan','Gen','Log'],t=['tabScan','tabGen','tabLog'],d=['scan','gen','log'];
  for(var i=0;i<3;i++){document.getElementById('panel'+p[i]).classList.remove('active');document.getElementById(t[i]).classList.remove('active')}
  var x=d.indexOf(id);document.getElementById('panel'+p[x]).classList.add('active');document.getElementById(t[x]).classList.add('active');
  if(id==='log')renderLog();
}
var _tt=null;function flash(m,w){var t=document.getElementById('toast');t.textContent=m;t.className='toast show'+(w?' warn':'');clearTimeout(_tt);_tt=setTimeout(function(){t.classList.remove('show')},3000)}

function showConfirm(type,value,info,btn,email,phone,addr,op){
  document.getElementById('cfIcon').textContent=type==='car'?'\u{1F697}':'\u{1F464}';
  document.getElementById('cfLabel').textContent=type==='car'?'VOZIDLO':'ZÁKAZNÍK';
  document.getElementById('cfValue').textContent=value;
  document.getElementById('cfInfo').textContent=info||'';
  document.getElementById('cfOkBtn').textContent=btn||'Zapsat';
  pendingConfirm={type:type,value:value,email:email||'',phone:phone||'',addr:addr||'',op:op||''};
  document.getElementById('confirmOverlay').classList.add('show');
}
function hideConfirm(){document.getElementById('confirmOverlay').classList.remove('show');pendingConfirm=null}
function confirmAction(){
  if(!pendingConfirm)return;
  var t=pendingConfirm.type,v=pendingConfirm.value,em=pendingConfirm.email,ph=pendingConfirm.phone,ad=pendingConfirm.addr,op=pendingConfirm.op;
  hideConfirm();if(t==='car')handleCar(v);else handleCustomer(v,em,ph,ad,op);
}

function showCustConfirm(name,em,ph,ad,op){
  var cr=findActiveRidesWithCustomer(name);
  if(cr.length){
    var oa=getActiveRides().filter(function(r){return cr.indexOf(r)===-1});
    if(oa.length)showConfirm('customer',name,'Přesun z '+cr[0].car+' \u2192 '+oa[0].car,'Přesunout',em,ph,ad,op);
    else showConfirm('customer',name,'Ukončí jízdu v: '+cr[0].car,'Ukončit',em,ph,ad,op);
  } else {
    var a=getActiveRides();
    if(a.length)showConfirm('customer',name,'\u2192 '+a[0].car,'Zapsat',em,ph,ad,op);
    else flash('\u26A0 Žádné aktivní auto',true);
  }
}

/* ── Core ── */
function getActiveRides(){var a=[];for(var i=0;i<rides.length;i++)if(!rides[i].end)a.push(rides[i]);if(_pendingRide&&!_pendingRide.end&&!findRideByKeyInArray(rides,_pendingRide._key))a.push(_pendingRide);return a}
function findRideByKey(k){var r=findRideByKeyInArray(rides,k);if(r)return r;if(_pendingRide&&_pendingRide._key===k)return _pendingRide;return null}
function findRideByKeyInArray(arr,k){for(var i=0;i<arr.length;i++)if(arr[i]._key===k)return arr[i];return null}
function findActiveByCarName(n){if(!n)return null;var l=n.toLowerCase();for(var i=0;i<rides.length;i++)if(!rides[i].end&&rides[i].car&&rides[i].car.toLowerCase()===l)return rides[i];return null}
function custName(c){return typeof c==='string'?c:c.name}
function findActiveRidesWithCustomer(n){
  var l=n.toLowerCase(),a=[];
  for(var i=0;i<rides.length;i++){if(rides[i].end)continue;var cs=rides[i].customers||[];
    for(var j=0;j<cs.length;j++)if(custName(cs[j]).toLowerCase()===l){a.push(rides[i]);break}}
  return a;
}

function handleCar(name){
  if(!getEventName()){warnEvent();return}
  var ex=findActiveByCarName(name);
  if(ex){endRideTx(ex._key)}
  var ev=document.getElementById('eventName').value.trim();
  var nr={car:name,start:new Date().toISOString(),end:null,customers:[],event:ev};
  var added=fbAdd(nr);lastActiveCarId=added._key;
  _pendingRide=added;
  flash('\u{1F697} '+(ex?'Nové kolo: ':'Nová jízda: ')+name);
  renderAll();
  if(!fbReady)loadRidesREST();
}
function handleCustomer(name,email,phone,addr,op){
  var cr=findActiveRidesWithCustomer(name);
  var obj={name:name,email:email||'',phone:phone||'',addr:addr||'',op:op||''};
  if(cr.length>0){
    var now=new Date().toISOString();
    for(var i=0;i<cr.length;i++){cr[i].end=now;endRideTx(cr[i]._key)}
    var rem=getActiveRides();
    if(rem.length>0){
      var tgt=null;if(lastActiveCarId){tgt=findRideByKey(lastActiveCarId);if(!tgt||tgt.end)tgt=null}
      if(!tgt)tgt=rem[0];if(!tgt.customers)tgt.customers=[];
      lastActiveCarId=tgt._key;addCustomerTx(tgt,obj);flash('\u{1F504} '+name+' \u2192 '+tgt.car);
    } else flash('\u{1F3C1} Ukončeno: '+name);
    if(!fbReady)loadRidesREST();return;
  }
  var act=getActiveRides();if(!act.length){flash('\u26A0 Nejdřív naskenuj auto!',true);return}
  var tgt=null;if(lastActiveCarId){tgt=findRideByKey(lastActiveCarId);if(tgt&&tgt.end)tgt=null}
  if(!tgt)tgt=act[0];if(!tgt.customers)tgt.customers=[];
  lastActiveCarId=tgt._key;addCustomerTx(tgt,obj);renderAll();flash('\u{1F464} '+name+' \u2192 '+tgt.car);
  if(!fbReady)loadRidesREST();
}
function endRide(key){var r=findRideByKey(key);if(r&&!r.end){endRideTx(key);flash('\u{1F3C1} '+r.car);if(!fbReady)loadRidesREST()}}
function endAllRides(){var a=getActiveRides();if(!a.length)return;if(!confirm('Ukončit '+a.length+' jízd?'))return;for(var i=0;i<a.length;i++){endRideTx(a[i]._key)}flash('Vše ukončeno');if(!fbReady)loadRidesREST()}
function clearAll(){if(!confirm('Smazat VŠECHNA data?'))return;if(!confirm('Opravdu?'))return;fbDeleteAll();flash('Smazáno');rides=[];renderAll()}
function manualAdd(){var c=document.getElementById('manualCar').value.trim(),u=document.getElementById('manualCust').value.trim(),op=document.getElementById('manualOP').value.trim(),em=document.getElementById('manualEmail').value.trim(),ph=document.getElementById('manualPhone').value.trim(),ad=document.getElementById('manualAddr').value.trim();if(!c&&!u){flash('Zadej vůz/zákazníka',true);return}if(c){handleCar(c);document.getElementById('manualCar').value=''}if(u){handleCustomer(u,em,ph,ad,op);saveCustomer(u,em,ph,ad,op);document.getElementById('manualCust').value='';document.getElementById('manualOP').value='';document.getElementById('manualEmail').value='';document.getElementById('manualPhone').value='';document.getElementById('manualAddr').value=''}}
function parseQRData(data,mode){try{var u=new URL(data);var p=u.searchParams;if(p.get('car'))return{type:'car',value:p.get('car')};if(p.get('customer'))return{type:'customer',value:p.get('customer'),email:p.get('email')||'',phone:p.get('phone')||'',addr:p.get('addr')||'',op:p.get('op')||''}}catch(e){}return{type:mode,value:data,email:'',phone:'',addr:'',op:''}}
