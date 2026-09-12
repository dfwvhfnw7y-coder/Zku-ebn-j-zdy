/* ── ZXing Scanner ── */
var _scanHandled=false;
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
        }else if(ex){info='Nové kolo (předchozí se ukončí)';btn='Nové kolo'}else info='Nová jízda';
      }else{
        var oldCust=findActiveRidesWithCustomer(parsed.value,parsed.email,parsed.phone);
        info='Vybrat zákazníka → potom naskenovat vozidlo';
        if(oldCust.length)info+=' · nyní jede v '+oldCust[0].car;
        btn='Vybrat';
      }
      showConfirm(parsed.type,parsed.value,info,btn,parsed.email,parsed.phone,parsed.addr,parsed.op);
    }
    if(!error&&!_scanHandled)document.getElementById('scanFoot').textContent='Namiřte QR kód do rámečku';
  }).catch(function(err){if(!_scanHandled)document.getElementById('scanFoot').textContent='Chyba: '+err.message});
}
function closeScan(){
  _scanHandled=true;
  if(scanControls){try{scanControls.stop()}catch(e){}}scanControls=null;torchOn=false;
  var v=document.getElementById('scanVideo');if(v&&v.srcObject){v.srcObject.getTracks().forEach(function(t){t.stop()});v.srcObject=null}
  document.getElementById('scanOverlay').classList.remove('show');scanMode=null;
  if(pendingCustomer)flash('👤 '+pendingCustomer.name+' zůstává vybraný');
}
var torchOn=false;
function toggleTorch(){var v=document.getElementById('scanVideo');if(!v||!v.srcObject)return;var track=v.srcObject.getVideoTracks()[0];if(!track)return;torchOn=!torchOn;track.applyConstraints({advanced:[{torch:torchOn}]}).then(function(){document.getElementById('torchBtn').style.opacity=torchOn?'1':'0.5'}).catch(function(){flash('Svítilna není dostupná',true);torchOn=false})}
