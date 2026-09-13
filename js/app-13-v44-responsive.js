/* ── V44 responsive UI state / V45 simplified flow ── */
(function(){
  function addCss(href){if(document.querySelector('link[rel="stylesheet"][href="'+href+'"]'))return;var l=document.createElement('link');l.rel='stylesheet';l.href=href;document.head.appendChild(l)}
  function loadCss(){addCss('css/v44-responsive.css?v=45');addCss('css/v44-fleet.css?v=45');addCss('css/v45.css?v=45');addCss('css/v44-aux.css?v=45');addCss('css/v44-typography.css?v=45');addCss('css/v44-hero-image.css?v=45')}
  function setNavA11y(){var tabs=['tabScan','tabGen','tabLog'];for(var i=0;i<tabs.length;i++){var t=document.getElementById(tabs[i]);if(!t)continue;t.setAttribute('role','button');t.setAttribute('tabindex','0');t.setAttribute('aria-label',t.textContent);t.onkeydown=function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();this.click()}}}}
  function updatePageTitle(){var active=document.querySelector('.tab.active');var name=active?active.textContent.trim():'Domů';document.title='Zkušební jízdy · '+name+' · v45'}
  function enhanceEmptyActive(){var el=document.getElementById('activeSection');if(!el||el.innerHTML.trim())return;el.innerHTML='<div class="v44-empty-active"><div class="icon">◇</div><strong>Žádná aktivní jízda</strong><small>Vyberte zákazníka a naskenujte vozidlo.</small></div>'}
  function removeLegacyFlow(){var f=document.getElementById('v44Flow');if(f&&f.parentNode)f.parentNode.removeChild(f)}
  var oldRenderActive=window.renderActive;if(oldRenderActive)window.renderActive=function(){oldRenderActive();enhanceEmptyActive();removeLegacyFlow()};
  var oldV44State=window.renderV44State;if(oldV44State)window.renderV44State=function(){oldV44State();removeLegacyFlow()};
  var oldSwitch=window.switchTab;if(oldSwitch)window.switchTab=function(id){oldSwitch(id);updatePageTitle();window.scrollTo({top:0,behavior:'smooth'})};
  function install(){loadCss();setNavA11y();updatePageTitle();removeLegacyFlow();enhanceEmptyActive();var s=document.createElement('script');s.src='js/app-14-v44-fleet.js?v=45';s.onload=function(){var x=document.createElement('script');x.src='js/app-15-v44-event-fleet.js?v=45';document.body.appendChild(x)};document.body.appendChild(s)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
  setInterval(removeLegacyFlow,1000);
})();
