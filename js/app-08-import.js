/* ── v43 Customer CSV import ── */
var importPreviewRows=[];
function openCustomerImport(){
  if(!getEventName()){warnEvent();return}
  document.getElementById('importText').value='';
  document.getElementById('importFile').value='';
  document.getElementById('importPreview').innerHTML='<div class="cpick-empty">Vlož CSV data nebo vyber soubor.</div>';
  document.getElementById('importRunBtn').style.display='none';
  importPreviewRows=[];
  document.getElementById('importOverlay').classList.add('show');
}
function closeCustomerImport(){document.getElementById('importOverlay').classList.remove('show')}
function readImportFile(input){
  var f=input&&input.files&&input.files[0];if(!f)return;
  var r=new FileReader();
  r.onload=function(){document.getElementById('importText').value=String(r.result||'');buildImportPreview()};
  r.onerror=function(){flash('Soubor se nepodařilo načíst',true)};
  r.readAsText(f,'UTF-8');
}
function importNorm(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'')}
function detectDelimiter(line){
  var semi=(line.match(/;/g)||[]).length,comma=(line.match(/,/g)||[]).length,tab=(line.match(/\t/g)||[]).length;
  if(tab>=semi&&tab>=comma)return'\t';
  return semi>=comma?';':',';
}
function parseDelimitedLine(line,delimiter){
  var out=[],cur='',quoted=false;
  for(var i=0;i<line.length;i++){
    var ch=line[i];
    if(ch==='"'){
      if(quoted&&line[i+1]==='"'){cur+='"';i++}else quoted=!quoted;
    }else if(ch===delimiter&&!quoted){out.push(cur.trim());cur=''}
    else cur+=ch;
  }
  out.push(cur.trim());return out;
}
function importHeaderMap(cols){
  var map={};
  var aliases={
    name:['jmeno','jmenoprijmeni','zakaznik','customer','name','fullname'],
    email:['email','mail','emailovaadresa'],
    phone:['telefon','mobil','phone','mobile','tel'],
    addr:['adresa','address','ulice','bydliste'],
    company:['firma','spolecnost','company','organization','organisation']
  };
  for(var i=0;i<cols.length;i++){
    var n=importNorm(cols[i]);
    for(var k in aliases)if(aliases[k].indexOf(n)>=0&&map[k]===undefined)map[k]=i;
  }
  return map;
}
function importSameEvent(c,eid,ev){return(c.eventId&&eid)?c.eventId===eid:(c.event||'')===ev}
function importDuplicateReason(row,eid,ev){
  var em=(row.email||'').trim().toLowerCase(),ph=(row.phone||'').replace(/\s+/g,''),nm=(row.name||'').trim().toLowerCase();
  var sameName=false;
  for(var i=0;i<regCustomers.length;i++){
    var c=regCustomers[i];if(!importSameEvent(c,eid,ev))continue;
    var ce=(c.email||'').trim().toLowerCase(),cp=(c.phone||'').replace(/\s+/g,''),cn=(c.name||'').trim().toLowerCase();
    if(em&&ce===em)return'E-mail už existuje';
    if(ph&&cp===ph)return'Telefon už existuje';
    if(nm&&cn===nm){if(em&&ce===em)return'Jméno + e-mail už existuje';sameName=true}
  }
  return sameName?'__WARN_NAME__':'';
}
function importDuplicateInPreview(row,rows){
  var em=(row.email||'').trim().toLowerCase(),ph=(row.phone||'').replace(/\s+/g,'');
  for(var i=0;i<rows.length;i++){
    var r=rows[i],re=(r.email||'').trim().toLowerCase(),rp=(r.phone||'').replace(/\s+/g,'');
    if(em&&re===em)return'Duplicitní e-mail v importu';
    if(ph&&rp===ph)return'Duplicitní telefon v importu';
  }
  return'';
}
function buildImportPreview(){
  var text=(document.getElementById('importText').value||'').replace(/^\uFEFF/,'').trim();
  if(!text){flash('Vlož CSV data',true);return}
  var lines=text.split(/\r?\n/).filter(function(x){return x.trim()!==''});
  if(lines.length<2){flash('CSV musí obsahovat hlavičku a alespoň jeden řádek',true);return}
  var delimiter=detectDelimiter(lines[0]),headers=parseDelimitedLine(lines[0],delimiter),map=importHeaderMap(headers);
  if(map.name===undefined){flash('Nenašel jsem sloupec Jméno / Name / Zákazník',true);return}
  var ev=getEventName(),eid=getCurrentEventId(),rows=[];
  for(var i=1;i<lines.length;i++){
    var c=parseDelimitedLine(lines[i],delimiter),row={
      name:(c[map.name]||'').trim(),email:map.email===undefined?'':(c[map.email]||'').trim(),
      phone:map.phone===undefined?'':(c[map.phone]||'').trim(),addr:map.addr===undefined?'':(c[map.addr]||'').trim(),
      company:map.company===undefined?'':(c[map.company]||'').trim(),status:'new',note:''
    };
    if(!row.name){row.status='error';row.note='Chybí jméno'}
    else{
      var dup=importDuplicateInPreview(row,rows)||importDuplicateReason(row,eid,ev);
      if(dup==='__WARN_NAME__'){row.status='warn';row.note='Stejné jméno už existuje — bude přidán jako nový'}
      else if(dup){row.status='duplicate';row.note=dup}
    }
    rows.push(row);
  }
  importPreviewRows=rows;renderImportPreview();
}
function renderImportPreview(){
  var el=document.getElementById('importPreview'),n=0,d=0,e=0,w=0,h='';
  for(var i=0;i<importPreviewRows.length;i++){
    var r=importPreviewRows[i];if(r.status==='new')n++;else if(r.status==='warn'){n++;w++}else if(r.status==='duplicate')d++;else e++;
    var icon=r.status==='duplicate'?'⏭':r.status==='error'?'❌':r.status==='warn'?'⚠️':'✅';
    h+='<div class="import-row"><div><strong>'+esc(r.name||'(bez jména)')+'</strong><div class="ci-detail">'+esc([r.email,r.phone,r.company].filter(Boolean).join(' · '))+'</div></div><span title="'+esc(r.note)+'">'+icon+'</span></div>';
  }
  h='<div class="import-summary">Noví: <b>'+n+'</b> · duplicity: <b>'+d+'</b> · chyby: <b>'+e+'</b>'+(w?' · upozornění: <b>'+w+'</b>':'')+'</div>'+h;
  el.innerHTML=h||'<div class="cpick-empty">Žádné řádky.</div>';
  document.getElementById('importRunBtn').style.display=n?'flex':'none';
}
function runCustomerImport(){
  if(!importPreviewRows.length)return;
  var ev=getEventName(),eid=getCurrentEventId(),todo=importPreviewRows.filter(function(r){return r.status==='new'||r.status==='warn'});
  if(!todo.length){flash('Není co importovat',true);return}
  var jobs=[];
  for(var i=0;i<todo.length;i++){
    var r=todo[i],obj={name:r.name,email:r.email||'',phone:r.phone||'',addr:r.addr||'',company:r.company||'',event:ev,eventId:eid,source:'import',created:new Date().toISOString()};
    if(fbReady&&db){jobs.push(db.ref('customers').push(obj))}else jobs.push(fbRest('POST','customers',obj));
  }
  Promise.all(jobs).then(function(){flash('📥 Importováno '+todo.length+' zákazníků');closeCustomerImport();if(!fbReady)loadCustomersREST()}).catch(function(err){flash('Chyba importu: '+err.message,true)});
}

/* v44: load event selector with release cache key */
(function(){var s=document.createElement('script');s.src='js/app-09-events-ui.js?v=44';document.body.appendChild(s)})();