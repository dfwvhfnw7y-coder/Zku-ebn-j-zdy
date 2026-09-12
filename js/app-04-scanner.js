/* ── ZXing Scanner ── */
function startScan(mode){
  scanMode=mode;
  document.getElementById('scanLabel').textContent=mode==='car'?'\u{1F697} Skenuj QR vozidla':'\u{1F464} Skenuj QR zákazníka';
  document.getElementById('scanFoot').textContent='Spouštím kameru\u2026';
  document.getElementById('scanOverlay').classList.add('show');
  var codeReader=new ZXingBrowser.BrowserQRCodeReader();
  codeReader.decodeFromConstraints({video:{facingMode:'environment'}},document.getElementById('scanVideo'),
    function(result,error,controls){
      scanControls=controls;
      if(result){
        controls.stop();scanControls=null;
        document.getElementById('scanOverlay').classList.remove('show');
        var parsed=parseQRData(result.getText(),scanMode);
        var info='',btn='Zapsat';
        if(parsed.type==='car'){
          var ex2=findActiveByCarName(parsed.value);
          if(ex2){info='Nové kolo (předchozí se ukončí)';btn='Nové kolo'}else{info='Nová jízda'}
        }else{
          var cr2=findActiveRidesWithCustomer(parsed.value);
          if(cr2.length>0){
            var oa=getActiveRides().filter(function(r){return cr2.indexOf(r)===-1});
            if(oa.length){info='Přesun z '+cr2[0].car+' \u2192 '+oa[0].car;btn='Přesunout'}
            else{info='Ukončí jízdu v: '+cr2[0].car;btn='Ukončit'}
          }else{var a2=getActiveRides();if(!a2.length)info='\u26A0 Žádné aktivní auto';else info='\u2192 '+a2[0].car}
        }
        showConfirm(parsed.type,parsed.value,info,btn,parsed.email,parsed.phone,parsed.addr,parsed.op);
      }
      if(!error)document.getElementById('scanFoot').textContent='Namiřte QR kód do rámečku';
    }
  ).catch(function(err){document.getElementById('scanFoot').textContent='Chyba: '+err.message});
}
function closeScan(){
  if(scanControls){try{scanControls.stop()}catch(e){}}scanControls=null;
  torchOn=false;
  var v=document.getElementById('scanVideo');if(v&&v.srcObject){v.srcObject.getTracks().forEach(function(t){t.stop()});v.srcObject=null}
  document.getElementById('scanOverlay').classList.remove('show');scanMode=null;
}
var torchOn=false;
function toggleTorch(){
  var v=document.getElementById('scanVideo');
  if(!v||!v.srcObject)return;
  var track=v.srcObject.getVideoTracks()[0];
  if(!track)return;
  torchOn=!torchOn;
  track.applyConstraints({advanced:[{torch:torchOn}]}).then(function(){
    document.getElementById('torchBtn').style.opacity=torchOn?'1':'0.5';
  }).catch(function(){flash('Svítilna není dostupná',true);torchOn=false});
}
