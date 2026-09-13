/* ── Render ── */
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
function fmtTime(i){if(!i)return'';return new Date(i).toLocaleString('cs-CZ',{day:'numeric',month:'numeric',hour:'2-digit',minute:'2-digit'})}
function fmtDur(a,b){if(!a||!b)return'';var m=Math.round((new Date(b)-new Date(a))/60000);return m<60?m+' min':Math.floor(m/60)+'h '+(m%60)+'min'}

function renderActive(){var a=getActiveRides(),el=document.getElementById('activeSection');if(!a.length){el.innerHTML='';return}var h='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><h3 style="font-size:13px;color:var(--accent);text-transform:uppercase;letter-spacing:1.5px">🟢 Aktivní ('+a.length+')</h3>';if(a.length>1)h+='<button class="btn btn-red btn-sm" onclick="endAllRides()">Ukončit vše</button>';h+='</div>';for(var i=0;i<a.length;i++){var r=a[i];h+='<div class="active-card"><div class="top"><div class="car">'+esc(r.car)+'</div><button class="end-btn" onclick="endRide(\''+r._key+'\')">Ukončit</button></div>';h+='<div style="font-size:12px;color:var(--text2);margin:4px 0">Od '+fmtTime(r.start)+'</div>';var cs=r.customers||[];if(cs.length){h+='<div class="customers">';for(var j=0;j<cs.length;j++)h+='<span>👤 '+esc(custName(cs[j]))+'</span> ';h+='</div>'}else h+='<div style="font-size:12px;color:var(--text2);font-style:italic">Žádný zákazník</div>';h+='<span class="active-tag">● PROBÍHÁ</span></div>'}el.innerHTML=h}

function ensureRideDetail(){
  if(document.getElementById('v45RideDetail'))return;
  var m=document.createElement('div');m.id='v45RideDetail';m.className='v45-ride-modal';
  m.innerHTML='<div class="v45-ride-sheet"><div class="v45-ride-head"><div><small>Detail jízdy</small><h3 id="v45RideCar">Vozidlo</h3></div><button type="button" id="v45RideClose">✕</button></div><div class="v45-ride-detail" id="v45RideInfo"></div><button type="button" class="v45-ride-delete" id="v45RideDelete">🗑 Smazat záznam jízdy</button></div>';
  document.body.appendChild(m);document.getElementById('v45RideClose').onclick=closeRideDetail;m.onclick=function(e){if(e.target===m)closeRideDetail()};
}
var _v45RideKey='';
function findRideByDetailKey(key){for(var i=0;i<rides.length;i++)if(rides[i]._key===key)return rides[i];return null}
function openRideDetail(key){
  ensureRideDetail();var r=findRideByDetailKey(key),m=document.getElementById('v45RideDetail');if(!r||!m)return;_v45RideKey=key;
  document.getElementById('v45RideCar').textContent=r.car||'Vozidlo';
  var cs=r.customers||[],names=[];for(var i=0;i<cs.length;i++)names.push(custName(cs[i]));
  var rows='<div><span>Zákazník</span><strong>'+esc(names.join(', ')||'Bez zákazníka')+'</strong></div><div><span>Začátek</span><strong>'+esc(fmtTime(r.start))+'</strong></div><div><span>Konec</span><strong>'+(r.end?esc(fmtTime(r.end)):'Probíhá')+'</strong></div>'+(r.end?'<div><span>Délka</span><strong>'+esc(fmtDur(r.start,r.end))+'</strong></div>':'');
  document.getElementById('v45RideInfo').innerHTML=rows;
  var del=document.getElementById('v45RideDelete');del.style.display=r.end?'block':'none';del.onclick=function(){deleteRideRecord(key)};
  m.classList.add('show');
}
function closeRideDetail(){var m=document.getElementById('v45RideDetail');if(m)m.classList.remove('show');_v45RideKey=''}
function deleteRideRecord(key){
  var r=findRideByDetailKey(key);if(!r)return;if(!r.end){flash('Probíhající jízdu nelze smazat. Nejdřív ji ukončete.',true);return}
  var who=(r.customers&&r.customers.length)?custName(r.customers[0]):'bez zákazníka';
  if(!confirm('Opravdu smazat tento záznam jízdy?\n\n'+(r.car||'Vozidlo')+' · '+who+' · '+fmtTime(r.start)+'\n\nTuto akci nelze vrátit zpět.'))return;
  var job=(fbReady&&ridesRef)?ridesRef.child(key).remove():fbRest('DELETE','rides/'+key);
  Promise.resolve(job).then(function(){closeRideDetail();if(!(fbReady&&ridesRef)){for(var i=rides.length-1;i>=0;i--)if(rides[i]._key===key)rides.splice(i,1);renderAll()}flash('🗑 Záznam jízdy smazán')}).catch(function(err){flash('Záznam se nepodařilo smazat: '+(err&&err.message?err.message:err),true)});
}

function renderLog(){var q=(document.getElementById('logSearch')?document.getElementById('logSearch').value:'').toLowerCase(),el=document.getElementById('logList'),f=[],all=getEventRides();for(var i=0;i<all.length;i++){var r=all[i];if(!q){f.push(r);continue}if((r.car||'').toLowerCase().indexOf(q)>=0){f.push(r);continue}var cs=r.customers||[];for(var j=0;j<cs.length;j++)if(custName(cs[j]).toLowerCase().indexOf(q)>=0){f.push(r);break}}if(!f.length){el.innerHTML='<div class="empty"><div class="ico">📋</div><p>Žádné záznamy pro tuto akci</p></div>';return}var h='';for(var i=0;i<f.length;i++){var r=f[i];h+='<div class="ride v45-ride-row" onclick="openRideDetail(\''+r._key+'\')"><div class="top"><div class="car">'+esc(r.car)+'</div><div class="time">'+fmtTime(r.start)+' <span class="v45-detail-arrow">›</span></div></div>';var cs=r.customers||[];if(cs.length){h+='<div class="customers">';for(var j=0;j<cs.length;j++){var c=cs[j],cn=custName(c),ce=typeof c==='object'?(c.email||''):'',cp=typeof c==='object'?(c.phone||''):'',ca=typeof c==='object'?(c.addr||''):'';h+='<span>👤 '+esc(cn);if(ce||cp||ca){h+=' <small style="color:var(--text2);font-weight:400">';var parts=[];if(ce)parts.push(esc(ce));if(cp)parts.push(esc(cp));if(ca)parts.push(esc(ca));h+=parts.join(' · ');h+='</small>'}h+='</span><br>'}h+='</div>'}h+=r.end?'<span class="dur">'+fmtDur(r.start,r.end)+'</span>':'<span class="active-tag">● PROBÍHÁ</span>';if(r.surveySent)h+=' <span style="font-size:11px;color:var(--accent);margin-left:4px">✉️</span>';h+='</div>'}el.innerHTML=h}
function updateBadge(){var t=new Date().toDateString(),c=0,all=getEventRides();for(var i=0;i<all.length;i++)if(new Date(all[i].start).toDateString()===t)c++;document.getElementById('countBadge').textContent=c}
function renderAll(){renderActive();renderLog();updateBadge()}
