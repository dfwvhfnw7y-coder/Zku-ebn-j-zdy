/* ── ZXing Scanner ── */
var _scanHandled=false;
function scanErrorActions(err){
  _scanHandled=true;
  if(scanControls){try{scanControls.stop()}catch(e){}}scanControls=null;torchOn=false;
  var v=document.getElementById('scanVideo');if(v&&v.srcObject){try{v.srcObject.getTracks().forEach(function(t){t.stop()})}catch(e){}v.srcObject=null}
  var foot=document.getElementById('scanFoot');if(!foot)return;
  var msg='Kamera se nepodařila spustit.';if(err&&err.message)msg+=' '+err.message;
  foot.innerHTML='<div style="margin-bottom:10px">'+msg+'</div><div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap"><button type="button" class="btn btn-accent btn-sm" onclick="retryScan()">Zkusit znovu</button><button type="button" class="btn btn-outline btn-sm" onclick="scannerFallback()">Použít bez kamery</button></div>';
}
function retryScan(){var mode=scanMode||'customer';closeScan();setTimeout(function(){startScan(mode)},120)}
function scannerFallback(){var mode=scanMode||'customer';closeScan();if(mode==='customer'){if(typeof openCustomerPicker==='function')openCustomerPicker();return}if(typeof switchTab==='function')switchTab('scan');var i=document.getElementById('manualCar');if(i){var card=i.closest?i.closest('.card'):null;if(card)card.classList.remove('v44-manual-collapsed');setTimeout(function(){try{i.focus()}catch(e){}},80)}if(typeof flash==='function')flash('Zadejte vůz ručně. Vybraný zákazník zůstává připravený.')}
function startScan(mode){
  scanMode=mode;_scanHandled=false;
  document.getElementById('scanLabel').textContent=mode==='car'?'🚗 Skenuj QR vozidla':'👤 Skenuj QR zákazníka';
  document.getElementById('scanFoot').textContent='Spouštím kameru…';
  document.getElementById('scanOverlay').classList.add('show');
  var codeReader=new ZXingBrowser.BrowserQRCodeReader();
  codeReader.decodeFromConstraints({video:{facingMode:'environment'}},document.getElementById('scanVideo'),function(result,error,controls){
    scanControls=controls;
    if(result&&!_scanHandled){
      _scanHandled=true;
      controls.stop();scanControls=null;document.getElementById('scanOverlay').classList.remove('show');
      var parsed=parseQRData(result.getText(),scanMode),info='',btn='Zapsat';
      if(parsed.type==='car'){
        var ex=findActiveByCarName(parsed.value);
        if(pendingCustomer){
          var old=findActiveRidesWithCustomer(pendingCustomer.name,pendingCustomer.email,pendingCustomer.phone);
          info=pendingCustomer.name+' → '+parsed.value;
          if(old.length)info+=' · předchozí jízda se ukončí';
          if(ex&&old.indexOf(ex)===-1)info+=' · aktivní jízda auta se ukončí';
          btn='Spustit jízdu';
        }else if(ex){info='Nejdřív vyberte zákazníka';btn='Zavřít'}else info='Nejdřív vyberte zákazníka';
      }else{
        var oldCust=findActiveRidesWithCustomer(parsed.value,parsed.email,parsed.phone);
        info='Vybrat zákazníka → potom naskenovat vozidlo';
        if(oldCust.length)info+=' · nyní jede v '+oldCust[0].car;
        btn='Vybrat';
      }
      showConfirm(parsed.type,parsed.value,info,btn,parsed.email,parsed.phone,parsed.addr,parsed.op);
    }
    if(!error&&!_scanHandled)document.getElementById('scanFoot').textContent='Namiřte QR kód do rámečku';
  }).catch(function(err){if(!_scanHandled)scanErrorActions(err)});
}
function closeScan(){
  _scanHandled=true;
  if(scanControls){try{scanControls.stop()}catch(e){}}scanControls=null;torchOn=false;
  var v=document.getElementById('scanVideo');if(v&&v.srcObject){v.srcObject.getTracks().forEach(function(t){t.stop()});v.srcObject=null}
  document.getElementById('scanOverlay').classList.remove('show');scanMode=null;
  var foot=document.getElementById('scanFoot');if(foot)foot.textContent='Namiřte QR kód do rámečku';
  if(pendingCustomer)flash('👤 '+pendingCustomer.name+' zůstává vybraný');
}
var torchOn=false;
function toggleTorch(){var v=document.getElementById('scanVideo');if(!v||!v.srcObject)return;var track=v.srcObject.getVideoTracks()[0];if(!track)return;torchOn=!torchOn;track.applyConstraints({advanced:[{torch:torchOn}]}).then(function(){document.getElementById('torchBtn').style.opacity=torchOn?'1':'0.5'}).catch(function(){flash('Svítilna není dostupná',true);torchOn=false})}
