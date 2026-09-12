/* ── V44 visual shell: no business logic lives here ── */
(function(){
  function addStyle(){
    if(document.querySelector('link[href="css/v44.css"]'))return;
    var l=document.createElement('link');l.rel='stylesheet';l.href='css/v44.css';document.head.appendChild(l);
  }
  function scanCarFromDashboard(){if(!pendingCustomer){flash('Nejdřív naskenujte nebo vyberte zákazníka.',true);var a=document.getElementById('v44Actions');if(a){a.classList.remove('v44-needs-customer');void a.offsetWidth;a.classList.add('v44-needs-customer')}return}startScan('car')}
  var originalManualAdd=window.manualAdd;
  if(originalManualAdd)window.manualAdd=function(){var car=document.getElementById('manualCar'),cust=document.getElementById('manualCust'),c=car?car.value.trim():'',u=cust?cust.value.trim():'';if(c&&!u&&!pendingCustomer){flash('Nejdřív zadejte nebo vyberte zákazníka.',true);if(cust)cust.focus();return}return originalManualAdd()};
  function installHero(){
    var panel=document.getElementById('panelScan');if(!panel||document.getElementById('v44Hero'))return;
    var hero=document.createElement('section');hero.id='v44Hero';hero.className='v44-hero';
    hero.innerHTML='<div class="v44-hero-title">Zkušební jízdy</div><div class="v44-hero-sub">Lidé. Vozy. Zážitek.</div>';
    panel.insertBefore(hero,panel.firstChild);

    var pending=document.createElement('div');pending.id='v44Pending';pending.className='v44-pending';
    pending.innerHTML='<div class="v44-avatar">👤</div><div><div class="name" id="v44PendingName"></div><div class="sub">Vybraný zákazník · dalším krokem je vozidlo</div></div><button class="change" type="button">Změnit</button>';
    pending.querySelector('.change').onclick=function(){pendingCustomer=null;openCustomerPicker();renderV44State()};
    hero.insertAdjacentElement('afterend',pending);

    var actions=document.createElement('div');actions.className='v44-actions';actions.id='v44Actions';
    actions.innerHTML='<button type="button" class="v44-action primary v44-action-customer-scan" id="v44ScanCustomer"><span class="ico">▦</span><span class="copy"><strong>Naskenovat zákazníka</strong><small>QR kód ze zákaznické kartičky</small></span><span class="arrow">›</span></button><button type="button" class="v44-action" id="v44PickCustomer"><span class="ico">👤</span><span class="copy"><strong>Vybrat ze seznamu</strong><small>Zákazník bez QR kartičky</small></span><span class="arrow">›</span></button><button type="button" class="v44-action" id="v44ScanCar"><span class="ico">🚗</span><span class="copy"><strong>Naskenovat vozidlo</strong><small>Nejdřív vyberte zákazníka</small></span><span class="arrow">›</span></button>';
    pending.insertAdjacentElement('afterend',actions);
    document.getElementById('v44ScanCustomer').onclick=function(){startScan('customer')};
    document.getElementById('v44PickCustomer').onclick=function(){openCustomerPicker()};
    document.getElementById('v44ScanCar').onclick=scanCarFromDashboard;

    var children=Array.prototype.slice.call(panel.children),hidden=0;
    for(var i=0;i<children.length;i++){
      var el=children[i];if(el===hero||el===pending||el===actions||el.id==='activeSection')continue;
      if(hidden<2&&el.tagName==='DIV'&&el.querySelector('button')){el.style.display='none';hidden++}
    }

    var active=document.getElementById('activeSection'),manual=null;
    if(active){var n=active.nextElementSibling;if(n&&n.classList.contains('card'))manual=n}
    if(manual){
      manual.classList.add('v44-manual-collapsed');
      var toggle=document.createElement('button');toggle.type='button';toggle.className='v44-manual-toggle';toggle.textContent='⌨ Ruční zadání';
      toggle.onclick=function(){manual.classList.toggle('v44-manual-collapsed');toggle.textContent=manual.classList.contains('v44-manual-collapsed')?'⌨ Ruční zadání':'✕ Skrýt ruční zadání'};
      manual.parentNode.insertBefore(toggle,manual);
    }
  }
  function syncLabel(){
    var s=document.getElementById('syncStatus');if(!s)return;
    var raw=s.getAttribute('data-raw-sync')||s.textContent||'';
    if(s.textContent==='Online'||s.textContent==='Offline')return;
    s.setAttribute('data-raw-sync',s.textContent||raw);
    s.textContent=(raw.indexOf('🔴')>=0||raw.indexOf('🟡')>=0)?'Offline':'Online';
  }
  function installHeader(){
    var h=document.querySelector('.hdr h1');if(h)h.textContent='S. & W. Automobily s.r.o.';
    var ver=document.getElementById('verBadge');if(ver)ver.textContent='v44';
    var tabs={tabScan:'Domů',tabGen:'QR kódy',tabLog:'Historie'};
    Object.keys(tabs).forEach(function(id){var x=document.getElementById(id);if(x)x.textContent=tabs[id]});
    var sync=document.getElementById('syncStatus');
    if(sync){var mo=new MutationObserver(function(){var txt=sync.textContent;if(txt==='Online'||txt==='Offline')return;sync.setAttribute('data-raw-sync',txt);sync.textContent=(txt.indexOf('🔴')>=0||txt.indexOf('🟡')>=0)?'Offline':'Online'});mo.observe(sync,{childList:true,characterData:true,subtree:true});syncLabel()}
  }
  window.renderV44State=function(){
    var bar=document.getElementById('v44Pending'),name=document.getElementById('v44PendingName'),pick=document.getElementById('v44PickCustomer'),scan=document.getElementById('v44ScanCustomer'),car=document.getElementById('v44ScanCar');
    if(!bar||!name)return;
    if(pendingCustomer){
      bar.classList.add('show');name.textContent=pendingCustomer.name||'Zákazník';
      if(pick){pick.querySelector('strong').textContent='Vybrat jiného';pick.querySelector('small').textContent='Změnit zákazníka ze seznamu'}
      if(scan){scan.querySelector('strong').textContent='Naskenovat jiného zákazníka';scan.querySelector('small').textContent='Načíst jinou QR kartičku'}
      if(car){car.classList.add('ready');car.querySelector('strong').textContent='Naskenovat vozidlo';car.querySelector('small').textContent='Spustit jízdu pro '+(pendingCustomer.name||'zákazníka')}
    }else{
      bar.classList.remove('show');
      if(pick){pick.querySelector('strong').textContent='Vybrat ze seznamu';pick.querySelector('small').textContent='Zákazník bez QR kartičky'}
      if(scan){scan.querySelector('strong').textContent='Naskenovat zákazníka';scan.querySelector('small').textContent='QR kód ze zákaznické kartičky'}
      if(car){car.classList.remove('ready');car.querySelector('strong').textContent='Naskenovat vozidlo';car.querySelector('small').textContent='Nejdřív vyberte zákazníka'}
    }
  };
  function install(){addStyle();installHeader();installHero();document.body.classList.add('v44-ready');renderV44State()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
  setInterval(function(){if(document.body.classList.contains('v44-ready'))renderV44State()},300);
})();
