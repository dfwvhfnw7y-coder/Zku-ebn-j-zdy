/* ── V44 visual shell: no business logic lives here ── */
(function(){
  function addStyle(){
    if(document.querySelector('link[href="css/v44.css"]'))return;
    var l=document.createElement('link');l.rel='stylesheet';l.href='css/v44.css';document.head.appendChild(l);
  }
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
    actions.innerHTML='<button type="button" class="v44-action primary" id="v44PickCustomer"><span class="ico">👤</span><span class="copy"><strong>Vybrat zákazníka</strong><small>Začněte výběrem zákazníka</small></span><span class="arrow">›</span></button><button type="button" class="v44-action" id="v44ScanCar"><span class="ico">▦</span><span class="copy"><strong>Naskenovat vozidlo</strong><small>QR kód vozidla</small></span><span class="arrow">›</span></button>';
    pending.insertAdjacentElement('afterend',actions);
    document.getElementById('v44PickCustomer').onclick=function(){openCustomerPicker()};
    document.getElementById('v44ScanCar').onclick=function(){startScan('car')};

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
    var bar=document.getElementById('v44Pending'),name=document.getElementById('v44PendingName'),pick=document.getElementById('v44PickCustomer');
    if(!bar||!name)return;
    if(pendingCustomer){bar.classList.add('show');name.textContent=pendingCustomer.name||'Zákazník';if(pick){pick.querySelector('strong').textContent=pendingCustomer.name||'Zákazník';pick.querySelector('small').textContent='Zákazník vybrán · naskenujte vozidlo'}}
    else{bar.classList.remove('show');if(pick){pick.querySelector('strong').textContent='Vybrat zákazníka';pick.querySelector('small').textContent='Začněte výběrem zákazníka'}}
  };
  function install(){addStyle();installHeader();installHero();document.body.classList.add('v44-ready');renderV44State()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
  setInterval(function(){if(document.body.classList.contains('v44-ready'))renderV44State()},300);
})();
