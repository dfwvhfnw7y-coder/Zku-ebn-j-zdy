/* ── V44 responsive UI state ── */
(function(){
  function addCss(href){if(document.querySelector('link[href="'+href+'"]'))return;var l=document.createElement('link');l.rel='stylesheet';l.href=href;document.head.appendChild(l)}
  function loadCss(){addCss('css/v44-responsive.css');addCss('css/v44-aux.css');addCss('css/v44-typography.css');addCss('css/v44-hero-image.css')}
  function setNavA11y(){var tabs=['tabScan','tabGen','tabLog'];for(var i=0;i<tabs.length;i++){var t=document.getElementById(tabs[i]);if(!t)continue;t.setAttribute('role','button');t.setAttribute('tabindex','0');t.setAttribute('aria-label',t.textContent);t.onkeydown=function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();this.click()}}}}
  function updatePageTitle(){var active=document.querySelector('.tab.active');var name=active?active.textContent.trim():'Domů';document.title='Zkušební jízdy · '+name+' · v44'}
  function enhanceEmptyActive(){var el=document.getElementById('activeSection');if(!el||el.innerHTML.trim())return;el.innerHTML='<div class="v44-empty-active"><div class="icon">◇</div><strong>Žádná aktivní jízda</strong><small>Vyberte zákazníka a naskenujte vozidlo.</small></div>'}
  function installFlow(){var actions=document.getElementById('v44Actions');if(!actions||document.getElementById('v44Flow'))return;var f=document.createElement('div');f.id='v44Flow';f.className='v44-flow';f.innerHTML='<div class="v44-flow-step customer">Zákazník</div><div class="v44-flow-step car">Vozidlo</div><div class="v44-flow-step ride">Jízda</div>';actions.insertAdjacentElement('afterend',f);renderFlow()}
  function renderFlow(){var f=document.getElementById('v44Flow');if(!f)return;var s=f.querySelectorAll('.v44-flow-step'),active=getActiveRides?getActiveRides():[];for(var i=0;i<s.length;i++)s[i].className=s[i].className.replace(/\s+(active|done)/g,'');if(active.length){s[0].classList.add('done');s[1].classList.add('done');s[2].classList.add('active')}else if(pendingCustomer){s[0].classList.add('done');s[1].classList.add('active')}else{s[0].classList.add('active')}}
  var oldRenderActive=window.renderActive;if(oldRenderActive)window.renderActive=function(){oldRenderActive();enhanceEmptyActive();renderFlow()};
  var oldV44State=window.renderV44State;if(oldV44State)window.renderV44State=function(){oldV44State();renderFlow()};
  var oldSwitch=window.switchTab;if(oldSwitch)window.switchTab=function(id){oldSwitch(id);updatePageTitle();window.scrollTo({top:0,behavior:'smooth'})};
  function install(){loadCss();setNavA11y();updatePageTitle();installFlow();enhanceEmptyActive();renderFlow();var s=document.createElement('script');s.src='js/app-14-v44-fleet.js';s.onload=function(){var x=document.createElement('script');x.src='js/app-15-v44-event-fleet.js';document.body.appendChild(x)};document.body.appendChild(s)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
  setInterval(renderFlow,1000);
})();
