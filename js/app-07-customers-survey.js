/* ── Customer registry ── */
var cpickAllEvents=false;
function getEventName(){return(document.getElementById('eventName').value||'').trim()}
function saveCustomer(name,email,phone,addr,op){
  if(!name)return;
  var ev=getEventName();
  var nl=name.toLowerCase(),el=(email||'').toLowerCase();
  for(var i=0;i<regCustomers.length;i++){
    var c=regCustomers[i];
    if((c.name||'').toLowerCase()===nl&&(c.email||'').toLowerCase()===el&&(c.event||'')===(ev||''))return;
  }
  var obj={name:name,email:email||'',phone:phone||'',addr:addr||'',op:op||'',event:ev,created:new Date().toISOString()};
  if(fbReady&&db){db.ref('customers').push(obj)}
  else{fbRest('POST','customers',obj)}
}
function customerRideCount(name){
  var c=0;
  for(var i=0;i<rides.length;i++){
    var cs=rides[i].customers||[];
    for(var j=0;j<cs.length;j++){var cn=typeof cs[j]==='object'?cs[j].name:cs[j];if(cn===name)c++}
  }
  return c;
}
function getCustomerEvents(){
  var evs={};
  for(var i=0;i<regCustomers.length;i++){var e=regCustomers[i].event||'';if(e)evs[e]=true}
  return Object.keys(evs).sort(function(a,b){return a.localeCompare(b,'cs')});
}
function openCustomerPicker(){
  if(!getActiveRides().length){flash('Nejdřív naskenuj auto',true);return}
  document.getElementById('cpickSearch').value='';
  cpickAllEvents=false;
  document.getElementById('cpickOverlay').classList.add('show');
  renderCustomerPicker();
  setTimeout(function(){document.getElementById('cpickSearch').focus()},100);
}
function closeCustomerPicker(){document.getElementById('cpickOverlay').classList.remove('show')}
function toggleCpickEvents(){cpickAllEvents=!cpickAllEvents;renderCustomerPicker()}
function renderCustomerPicker(){
  var q=(document.getElementById('cpickSearch').value||'').toLowerCase().trim();
  var ev=getEventName();
  var filtered=[];
  for(var i=0;i<regCustomers.length;i++){
    var c=regCustomers[i];
    if(!cpickAllEvents&&ev&&(c.event||'')!==ev)continue;
    var s=(c.name+' '+c.email+' '+c.phone+' '+c.addr).toLowerCase();
    if(!q||s.indexOf(q)!==-1)filtered.push(c);
  }
  var el=document.getElementById('cpickList');
  // Header with toggle + count
  var evLabel=cpickAllEvents?'Všechny akce':(ev||'Bez názvu akce');
  var otherEvents=getCustomerEvents();
  var h='<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0 8px">';
  h+='<span style="font-size:12px;color:var(--text2)">'+esc(evLabel)+' · '+filtered.length+' zákazníků</span>';
  if(otherEvents.length>0)h+='<button onclick="toggleCpickEvents()" style="font-size:12px;color:var(--accent);background:none;border:1px solid var(--accent);padding:3px 10px;border-radius:12px;cursor:pointer;font-weight:600">'+(cpickAllEvents?'Jen tato akce':'Všechny akce')+'</button>';
  h+='</div>';
  if(!filtered.length){
    h+='<div class="cpick-empty">'+(regCustomers.length?'Žádná shoda'+(cpickAllEvents?'':' — zkuste „Všechny akce"'):'Zatím žádní zákazníci.<br>Vytvořte QR v záložce QR kódy.')+'</div>';
    el.innerHTML=h;return;
  }
  var lastLetter='';
  for(var i=0;i<filtered.length;i++){
    var c=filtered[i],fl=(c.name||'?')[0].toUpperCase();
    if(fl!==lastLetter){lastLetter=fl;h+='<div class="cpick-alpha">'+esc(fl)+'</div>'}
    var rc=customerRideCount(c.name);
    var detail=[];
    if(c.op)detail.push('OP/\u0158P: '+c.op);
    if(c.email)detail.push(c.email);if(c.phone)detail.push(c.phone);
    if(cpickAllEvents&&c.event)detail.push('\uD83D\uDCCB '+c.event);
    h+='<div class="cpick-item" onclick="pickCustomer('+i+')">';
    h+='<div><div class="ci-name">'+esc(c.name)+'</div>';
    if(detail.length)h+='<div class="ci-detail">'+esc(detail.join(' · '))+'</div>';
    h+='</div>';
    if(rc)h+='<div class="ci-badge">'+rc+'×</div>';
    h+='</div>';
  }
  el.innerHTML=h;
  el._filtered=filtered;
}
function pickCustomer(idx){
  var list=document.getElementById('cpickList')._filtered;
  if(!list||!list[idx])return;
  var c=list[idx];
  closeCustomerPicker();
  handleCustomer(c.name,c.email||'',c.phone||'',c.addr||'',c.op||'');
}

/* ── EmailJS — dotazníky ── */
var EMAILJS_PK='B8AOopYxajiDIXEJT';
var EMAILJS_SVC='service_dqlpkln';
var EMAILJS_TPL='template_9pecuuf';
var SURVEY_BASE='https://dfwvhfnw7y-coder.github.io/Zku-ebn-j-zdy/dotaznik.html';

try{emailjs.init(EMAILJS_PK)}catch(e){console.warn('EmailJS init failed',e)}

function sendSurveys(){
  var toSend=[];
  for(var i=0;i<rides.length;i++){
    var r=rides[i];
    if(!r.end)continue;
    if(r.surveySent)continue;
    var cs=r.customers||[];
    for(var j=0;j<cs.length;j++){
      var c=cs[j];
      if(typeof c==='object'&&c.email&&c.email.trim()){
        toSend.push({ride:r,customer:c});
      }
    }
  }
  if(!toSend.length){flash('Žádné jízdy k odeslání (chybí email nebo již odesláno)',true);return}
  if(!confirm('Odeslat dotazník '+toSend.length+' zákazníkům?'))return;

  var sent=0,fail=0,total=toSend.length;
  flash('Odesílám 0/'+total+'…');

  function sendNext(idx){
    if(idx>=total){
      if(fail)flash('Odesláno '+sent+'/'+total+' ('+fail+' chyb)',true);
      else flash('✉️ Odesláno '+sent+' dotazníků');
      renderLog();
      return;
    }
    var item=toSend[idx];
    var r=item.ride,c=item.customer;
    var link=SURVEY_BASE+'?rid='+encodeURIComponent(r._key)+'&car='+encodeURIComponent(r.car)+'&name='+encodeURIComponent(c.name);
    var params={
      customer_email:c.email.trim(),
      customer_name:c.name,
      car_name:r.car,
      survey_link:link
    };
    emailjs.send(EMAILJS_SVC,EMAILJS_TPL,params).then(function(){
      sent++;
      r.surveySent=true;
      fbWrite(r);
      flash('Odesílám '+sent+'/'+total+'…');
      sendNext(idx+1);
    }).catch(function(err){
      console.error('EmailJS error for '+c.email,err);
      fail++;
      sendNext(idx+1);
    });
  }
  sendNext(0);
}
