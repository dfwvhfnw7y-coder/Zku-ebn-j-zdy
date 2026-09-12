/* ── QR Gen ── */
function generateQR(type){
  var iid=type==='car'?'genCarInput':'genCustInput',cid=type==='car'?'qrCarContainer':'qrCustContainer',nid=type==='car'?'qrCarName':'qrCustName',oid=type==='car'?'qrCarOutput':'qrCustOutput';
  var val=document.getElementById(iid).value.trim();if(!val){flash('Zadej hodnotu',true);return}
  var url=BASE_URL+'?'+(type==='car'?'car':'customer')+'='+encodeURIComponent(val);
  if(type==='customer'){
    var op=document.getElementById('genCustOP').value.trim(),em=document.getElementById('genCustEmail').value.trim(),ph=document.getElementById('genCustPhone').value.trim(),ad=document.getElementById('genCustAddr').value.trim();
    if(op)url+='&op='+encodeURIComponent(op);
    if(em)url+='&email='+encodeURIComponent(em);if(ph)url+='&phone='+encodeURIComponent(ph);if(ad)url+='&addr='+encodeURIComponent(ad);
    saveCustomer(val,em,ph,ad,op);
  }
  var c=document.getElementById(cid);c.innerHTML='';
  new QRCode(c,{text:url,width:512,height:512,colorDark:'#000',colorLight:'#fff',correctLevel:QRCode.CorrectLevel.M,margin:4});
  var lbl=(type==='car'?'\u{1F697} ':'\u{1F464} ')+val;
  if(type==='customer'){var extras=[];}
  document.getElementById(nid).textContent=lbl;document.getElementById(oid).style.display='block';
}
/* v41: bílá quiet zone zapečená přímo do obrázku (tisk i PNG), nezávisle na okolí */
function qrPadCanvas(el){var cv=el.querySelector('canvas');if(!cv)return null;var pad=Math.round(cv.width/8);var pc=document.createElement('canvas');pc.width=cv.width+pad*2;pc.height=cv.height+pad*2;var x=pc.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,pc.width,pc.height);x.drawImage(cv,pad,pad);return pc}
function printQR(type){
  var cid=type==='car'?'qrCarContainer':'qrCustContainer',nid=type==='car'?'qrCarName':'qrCustName',lbl=type==='car'?'VOZIDLO':'ZÁKAZNÍK';
  var el=document.getElementById(cid),im=el.querySelector('img');
  var pc=qrPadCanvas(el);var src=pc?pc.toDataURL():im?im.src:null;if(!src)return;
  var name=document.getElementById(nid).textContent;
  document.getElementById('printArea').innerHTML='<div style="text-align:center;padding:40px;font-family:-apple-system,sans-serif"><div style="font-size:12px;color:#666;text-transform:uppercase;letter-spacing:2px;margin-bottom:8px">'+lbl+'</div><img id="_printImg" style="width:300px;height:300px"><div style="font-size:22px;font-weight:700;margin-top:12px">'+esc(name)+'</div><div style="font-size:11px;color:#999;margin-top:8px">S. &amp; W. Automobily s.r.o.</div></div>';
  var _pi=document.getElementById('_printImg');
  _pi.onload=function(){setTimeout(function(){window.print()},50)};
  _pi.onerror=function(){window.print()};
  _pi.src=src;
  if(_pi.complete&&_pi.naturalWidth){_pi.onload=null;setTimeout(function(){window.print()},50)}
}
async function shareQR(type){
  var cid=type==='car'?'qrCarContainer':'qrCustContainer',nid=type==='car'?'qrCarName':'qrCustName';
  var el=document.getElementById(cid),cv=el.querySelector('canvas'),im=el.querySelector('img');
  var name=document.getElementById(nid).textContent;
  if(!navigator.canShare){flash('Sdílení není podporováno v tomto prohlížeči',true);return}
  try{
    var blob;
    var pc=qrPadCanvas(el);
    if(pc){blob=await new Promise(function(r){pc.toBlob(r,'image/png')})}
    else if(im){var resp=await fetch(im.src);blob=await resp.blob()}
    else{return}
    var file=new File([blob],'QR-'+name.replace(/[^a-zA-Z0-9]/g,'_')+'.png',{type:'image/png'});
    if(!navigator.canShare({files:[file]})){flash('Sdílení obrázků není podporováno',true);return}
    await navigator.share({title:'QR – '+name,text:name,files:[file]});
  }catch(e){if(e.name!=='AbortError')flash('Chyba sdílení: '+e.message,true)}
}
function exportLog(){
  if(!rides.length){flash('Žádná data',true);return}
  var csv='\uFEFF"Akce";"Vozidlo";"Zákazník";"Číslo OP/ŘP";"E-mail";"Telefon";"Adresa";"Začátek";"Konec";"Trvání"\n';
  for(var i=0;i<rides.length;i++){var r=rides[i];var cs=r.customers||[];
    if(!cs.length){csv+='"'+(r.event||'')+'";"'+r.car+'";"";"";"";"";"";"'+fmtTime(r.start)+'";"'+(r.end?fmtTime(r.end):'probíhá')+'";"'+(r.end?fmtDur(r.start,r.end):'')+'";\n'}
    else{for(var j=0;j<cs.length;j++){
      var c=cs[j],cn=custName(c),co=typeof c==='object'?(c.op||''):'',ce=typeof c==='object'?(c.email||''):'',cp=typeof c==='object'?(c.phone||''):'',ca=typeof c==='object'?(c.addr||''):'';
      csv+='"'+(r.event||'')+'";"'+r.car+'";"'+cn+'";"'+co+'";"'+ce+'";"'+cp+'";"'+ca+'";"'+fmtTime(r.start)+'";"'+(r.end?fmtTime(r.end):'probíhá')+'";"'+(r.end?fmtDur(r.start,r.end):'')+'";\n'}}
  }
  var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download='zkusebni-jizdy-'+new Date().toISOString().slice(0,10)+'.csv';a.click();
}
