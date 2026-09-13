/* ── V45 final UI: keep the event bar focused on the event name ── */
(function(){
  function moveEventAdminToHistory(){
    var log=document.getElementById('panelLog');if(!log)return;
    var tools=log.firstElementChild;if(!tools)return;
    var archive=document.getElementById('v45ArchiveListBtn');
    var manage=document.getElementById('eventManageBtn');
    if(archive&&!archive.classList.contains('v45-history-event-tool')){
      archive.classList.add('v45-history-event-tool');archive.textContent='📦 Archiv';archive.title='Archivované akce';tools.appendChild(archive);
    }
    if(manage&&!manage.classList.contains('v45-history-event-tool')){
      manage.classList.add('v45-history-event-tool');manage.textContent='••• Akce';manage.title='Archivovat aktuální akci';tools.appendChild(manage);
    }
  }
  function install(){moveEventAdminToHistory();setTimeout(moveEventAdminToHistory,400)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
  setInterval(moveEventAdminToHistory,1200);
})();
