/* ── Render ── */
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
function fmtTime(i){if(!i)return'';return new Date(i).toLocaleString('cs-CZ',{day:'numeric',month:'numeric',hour:'2-digit',minute:'2-digit'})}
function fmtDur(a,b){if(!a||!b)return'';var m=Math.round((new Date(b)-new Date(a))/60000);return m<60?m+' min':Math.floor(m/60)+'h '+(m%60)+'min'}

function renderActive(){
  var a=getActiveRides(),el=document.getElementById('activeSection');
  if(!a.length){el.innerHTML='';return}
  var h='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><h3 style="font-size:13px;color:var(--accent);text-transform:uppercase;letter-spacing:1.5px">\u{1F7E2} Aktivní ('+a.length+')</h3>';
  if(a.length>1)h+='<button class="btn btn-red btn-sm" onclick="endAllRides()">Ukončit vše</button>';
  h+='</div>';
  for(var i=0;i<a.length;i++){var r=a[i];
    h+='<div class="active-card"><div class="top"><div class="car">'+esc(r.car)+'</div><button class="end-btn" onclick="endRide(\''+r._key+'\')">Ukončit</button></div>';
    h+='<div style="font-size:12px;color:var(--text2);margin:4px 0">Od '+fmtTime(r.start)+'</div>';
    var cs=r.customers||[];
    if(cs.length){h+='<div class="customers">';for(var j=0;j<cs.length;j++)h+='<span>\u{1F464} '+esc(custName(cs[j]))+'</span> ';h+='</div>'}
    else h+='<div style="font-size:12px;color:var(--text2);font-style:italic">Žádný zákazník</div>';
    h+='<span class="active-tag">\u25CF PROBÍHÁ</span></div>';
  }
  el.innerHTML=h;
}
function renderLog(){
  var q=(document.getElementById('logSearch')?document.getElementById('logSearch').value:'').toLowerCase(),el=document.getElementById('logList'),f=[];
  for(var i=0;i<rides.length;i++){var r=rides[i];if(!q){f.push(r);continue}if(r.car.toLowerCase().indexOf(q)>=0){f.push(r);continue}if(r.event&&r.event.toLowerCase().indexOf(q)>=0){f.push(r);continue}var cs=r.customers||[];for(var j=0;j<cs.length;j++)if(custName(cs[j]).toLowerCase().indexOf(q)>=0){f.push(r);break}}
  if(!f.length){el.innerHTML='<div class="empty"><div class="ico">\u{1F4CB}</div><p>Žádné záznamy</p></div>';return}
  var h='';for(var i=0;i<f.length;i++){var r=f[i];
    h+='<div class="ride"><div class="top"><div class="car">'+esc(r.car)+'</div><div class="time">'+fmtTime(r.start)+'</div></div>';
    if(r.event)h+='<div style="font-size:11px;color:var(--blue);margin-bottom:4px">\u{1F4CB} '+esc(r.event)+'</div>';
    var cs=r.customers||[];
    if(cs.length){h+='<div class="customers">';for(var j=0;j<cs.length;j++){
      var c=cs[j],cn=custName(c),ce=typeof c==='object'?(c.email||''):'',cp=typeof c==='object'?(c.phone||''):'',ca=typeof c==='object'?(c.addr||''):'';
      h+='<span>\u{1F464} '+esc(cn);
      if(ce||cp||ca){h+=' <small style="color:var(--text2);font-weight:400">';var parts=[];if(ce)parts.push(esc(ce));if(cp)parts.push(esc(cp));if(ca)parts.push(esc(ca));h+=parts.join(' \u00B7 ');h+='</small>'}
      h+='</span><br>'}h+='</div>'}
    h+=r.end?'<span class="dur">'+fmtDur(r.start,r.end)+'</span>':'<span class="active-tag">\u25CF PROBÍHÁ</span>';
    if(r.surveySent)h+=' <span style="font-size:11px;color:var(--accent);margin-left:4px">✉️</span>';
    h+='</div>';
  }
  el.innerHTML=h;
}
function updateBadge(){var t=new Date().toDateString(),c=0;for(var i=0;i<rides.length;i++)if(new Date(rides[i].start).toDateString()===t)c++;document.getElementById('countBadge').textContent=c}
function renderAll(){renderActive();renderLog();updateBadge()}
