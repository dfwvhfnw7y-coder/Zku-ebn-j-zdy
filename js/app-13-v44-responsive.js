/* ── V44 responsive UI state ── */
(function(){
  function loadCss(){if(document.querySelector('link[href="css/v44-responsive.css"]'))return;var l=document.createElement('link');l.rel='stylesheet';l.href='css/v44-responsive.css';document.head.appendChild(l)}
  function setNavA11y(){var tabs=['tabScan','tabGen','tabLog'];for(var i=0;i<tabs.length;i++){var t=document.getElementById(tabs[i]);if(!t)continue;t.setAttribute('role','button');t.setAttribute('tabindex','0');t.setAttribute('aria-label',t.textContent);t.onkeydown=function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();this.click()}}}}
  function updatePageTitle(){var active=document.querySelector('.tab.active');var name=active?active.textContent.trim():'Domů';document.title='Zkušební jízdy · '+name+' · v44'}
  function enhanceEmptyActive(){var el=document.getElementById('activeSection');if(!el||el.innerHTML.trim())return;el.innerHTML='<div class="v44-empty-active"><div class="icon">◇</div><strong>Žádná aktivní jízda</strong><small>Vyberte zákazníka a naskenujte vozidlo.</small></div>'}
  var oldRenderActive=window.renderActive;
  if(oldRenderActive)window.renderActive=function(){oldRenderActive();enhanceEmptyActive()};
  var oldSwitch=window.switchTab;
  if(oldSwitch)window.switchTab=function(id){oldSwitch(id);updatePageTitle();window.scrollTo({top:0,behavior:'smooth'})};
  function install(){loadCss();setNavA11y();updatePageTitle();enhanceEmptyActive();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
