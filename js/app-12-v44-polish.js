/* ── V44 final presentation: QR + history ── */
(function(){
  function e44(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
  function customerLine(c){if(typeof c!=='object')return{n:c||'',d:''};var d=[c.email||'',c.phone||''].filter(Boolean).join(' · ');return{n:c.name||'',d:d}}
  function installHeadings(){
    var gen=document.getElementById('panelGen');
    if(gen&&!document.getElementById('v44QrHead')){var h=document.createElement('div');h.id='v44QrHead';h.className='v44-section-head';h.innerHTML='<div><h2>QR kódy</h2><p>Vozidla a zákazníci pro rychlé párování</p></div><span class="mini">v44</span>';gen.insertBefore(h,gen.firstChild)}
    var log=document.getElementById('panelLog');
    if(log&&!document.getElementById('v44HistoryHead')){var x=document.createElement('div');x.id='v44HistoryHead';x.className='v44-history-title';x.innerHTML='<h2>Historie</h2><p>Jízdy právě vybrané akce</p>';log.insertBefore(x,log.firstChild)}
  }
  function decorateQrCards(){
    var gen=document.getElementById('panelGen');if(!gen)return;var cards=gen.querySelectorAll(':scope > .card');
    if(cards[0]&&!cards[0].querySelector('.v44-qr-type')){var a=document.createElement('div');a.className='v44-qr-type';a.innerHTML='<div class="ico">🚗</div><div class="copy"><strong>QR vozidla</strong><small>Vygenerujte kód pro vůz</small></div>';cards[0].insertBefore(a,cards[0].firstChild);var h=cards[0].querySelector('h3');if(h)h.style.display='none'}
    if(cards[1]&&!cards[1].querySelector('.v44-qr-type')){var b=document.createElement('div');b.className='v44-qr-type';b.innerHTML='<div class="ico">👤</div><div class="copy"><strong>QR zákazníka</strong><small>Kontaktní údaje a rychlý start</small></div>';cards[1].insertBefore(b,cards[1].firstChild);var h2=cards[1].querySelector('h3');if(h2)h2.style.display='none';var q=document.createElement('button');q.type='button';q.className='btn btn-outline v44-customer-card-btn';q.textContent='🪪 Vybrat zákazníka a vytisknout kartičku';q.onclick=function(){window.v44CardPrintMode=true;openCustomerPicker()};cards[1].insertBefore(q,cards[1].querySelector('input'))}
  }
  function fillCustomerQr(c){if(!c)return;var name=typeof c==='object'?(c.name||''):String(c),email=typeof c==='object'?(c.email||''):'',phone=typeof c==='object'?(c.phone||''):'',addr=typeof c==='object'?(c.addr||''):'',op=typeof c==='object'?(c.op||''):'';var map={genCustInput:name,genCustEmail:email,genCustPhone:phone,genCustAddr:addr,genCustOP:op};Object.keys(map).forEach(function(id){var el=document.getElementById(id);if(el)el.value=map[id]});generateQR('customer');setTimeout(function(){printQR('customer')},120)}
  function installCardPrintPicker(){var original=window.selectCustomerForRide;if(!original||original._v44CardPrint)return;function wrapped(name,email,phone,addr,op,startScanner){if(window.v44CardPrintMode){window.v44CardPrintMode=false;closeCustomerPicker();switchTab('gen');fillCustomerQr({name:name,email:email,phone:phone,addr:addr,op:op});return}return original(name,email,phone,addr,op,startScanner)}wrapped._v44CardPrint=true;window.selectCustomerForRide=wrapped}
  window.renderLog=function(){
    var q=(document.getElementById('logSearch')?document.getElementById('logSearch').value:'').toLowerCase(),el=document.getElementById('logList'),all=getEventRides(),f=[];if(!el)return;
    for(var i=0;i<all.length;i++){var r=all[i],hit=!q||(r.car||'').toLowerCase().indexOf(q)>=0;if(!hit){var cs=r.customers||[];for(var j=0;j<cs.length;j++)if(custName(cs[j]).toLowerCase().indexOf(q)>=0){hit=true;break}}if(hit)f.push(r)}
    if(!f.length){el.innerHTML='<div class="empty"><div class="ico">◷</div><p>Žádné záznamy pro tuto akci</p></div>';return}
    var h='';for(var k=0;k<f.length;k++){var r=f[k],cs=r.customers||[],cl=cs.length?customerLine(cs[0]):{n:'Bez zákazníka',d:''};h+='<div class="v44-history-card"><div class="top"><div class="car">'+e44(r.car)+'</div><div class="time">'+e44(fmtTime(r.start))+'</div></div><div class="customer">👤 '+e44(cl.n)+(cl.d?'<small>'+e44(cl.d)+'</small>':'')+'</div><div class="bottom"><span class="duration">'+(r.end?e44(fmtDur(r.start,r.end)):'Probíhá od '+e44(fmtTime(r.start)))+'</span><span class="'+(r.end?'done':'live')+'">'+(r.end?'Dokončeno':'Probíhá')+'</span></div></div>'}el.innerHTML=h;
  };
  var oldSwitch=window.switchTab;
  window.switchTab=function(id){oldSwitch(id);if(id==='gen')decorateQrCards();if(id==='log')renderLog()};
  function install(){var l=document.createElement('link');l.rel='stylesheet';l.href='css/v44-polish.css';document.head.appendChild(l);installHeadings();decorateQrCards();installCardPrintPicker();renderLog()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
