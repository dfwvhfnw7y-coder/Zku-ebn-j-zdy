var APP_VERSION=44;
document.getElementById('verBadge').textContent='v'+APP_VERSION;
var FB_URL="https://testovaci-jizdy-default-rtdb.europe-west1.firebasedatabase.app";
var BASE_URL="https://dfwvhfnw7y-coder.github.io/Zku-ebn-j-zdy/index.html";
var VERSION_URL="https://dfwvhfnw7y-coder.github.io/Zku-ebn-j-zdy/version.json";
var rides=[],regCustomers=[],events=[],pendingConfirm=null,pendingCustomer=null,lastActiveCarId=null,scanMode=null,scanControls=null,_pendingRide=null;
var fbReady=false,db=null,ridesRef=null,eventsRef=null,currentEventId='';

/* ── PIN Lock ── */
var PIN_CODE='7319',pinEntry='',pinLocked=true;
if(sessionStorage.getItem('pinOK')==='1'){pinLocked=false;document.getElementById('pinOverlay').classList.add('hidden')}
function pinKey(n){if(pinEntry.length>=4)return;pinEntry+=n;for(var i=0;i<4;i++){var d=document.getElementById('pd'+i);d.classList.toggle('filled',i<pinEntry.length);d.classList.remove('error')}if(pinEntry.length===4){if(pinEntry===PIN_CODE){pinLocked=false;sessionStorage.setItem('pinOK','1');document.getElementById('pinOverlay').classList.add('hidden');doAuth()}else{for(var j=0;j<4;j++)document.getElementById('pd'+j).classList.add('error');setTimeout(function(){pinEntry='';for(var k=0;k<4;k++){var d=document.getElementById('pd'+k);d.classList.remove('filled','error')}},600)}}}
function pinBack(){if(pinEntry.length>0){pinEntry=pinEntry.slice(0,-1);for(var i=0;i<4;i++){var d=document.getElementById('pd'+i);d.classList.toggle('filled',i<pinEntry.length);d.classList.remove('error')}}}

/* ── Version check ── */
var _updBannerShown=false;
function checkUpdate(){fetch(VERSION_URL+'?t='+Date.now(),{cache:'no-store'}).then(function(r){return r.json()}).then(function(d){if(d&&d.version>APP_VERSION){try{if(sessionStorage.getItem('upd')!==String(d.version)){sessionStorage.setItem('upd',String(d.version));location.replace(BASE_URL+'?v='+d.version+'&t='+Date.now());return}}catch(e){}if(_updBannerShown)return;_updBannerShown=true;var b=document.createElement('div');b.style.cssText='position:fixed;top:0;left:0;right:0;z-index:9999;background:#00c9a7;color:#000;text-align:center;padding:10px 16px;font-size:13px;font-weight:600;cursor:pointer;display:flex;justify-content:center;align-items:center;gap:8px';b.innerHTML='🔄 Nová verze v'+d.version+' je k dispozici <span style="background:#000;color:#fff;padding:4px 12px;border-radius:8px;font-size:12px">Aktualizovat</span>';b.onclick=function(){location.replace(BASE_URL+'?v='+d.version+'&t='+Date.now())};document.body.prepend(b)}}).catch(function(){})}
setTimeout(checkUpdate,2000);document.addEventListener('visibilitychange',function(){if(!document.hidden)checkUpdate()});window.addEventListener('pageshow',function(){checkUpdate()});

/* ── Event / eventId ── */
function newEventId(){return'evt_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8)}
function eventById(id){for(var i=0;i<events.length;i++)if(events[i]._key===id)return events[i];return null}
function eventByName(name){var n=(name||'').trim().toLowerCase(),best=null,bt=0;for(var i=0;i<events.length;i++){var e=events[i];if((e.name||'').trim().toLowerCase()!==n)continue;var t=new Date(e.createdAt||0).getTime()||0;if(!best||t>=bt){best=e;bt=t}}return best}
function persistEventSelection(name,id){try{localStorage.setItem('sw-event',name||'');localStorage.setItem('sw-event-id',id||'')}catch(e){}}
function ensureEventId(name){name=(name||'').trim();if(!name)return'';var storedName='';try{storedName=localStorage.getItem('sw-event')||''}catch(e){}if(currentEventId&&storedName===name)return currentEventId;var ex=eventByName(name);if(ex){currentEventId=ex._key;persistEventSelection(name,currentEventId);return currentEventId}var id=newEventId(),obj={name:name,createdAt:new Date().toISOString(),status:'active'};currentEventId=id;events.push({_key:id,name:obj.name,createdAt:obj.createdAt,status:obj.status});persistEventSelection(name,id);if(fbReady&&db)db.ref('events/'+id).set(obj);else fbRest('PUT','events/'+id,obj);return id}
function getCurrentEventId(){var name=(document.getElementById('eventName').value||'').trim();return name?ensureEventId(name):''}
function saveEventName(){var name=(document.getElementById('eventName').value||'').trim();if(name)ensureEventId(name);else{currentEventId='';persistEventSelection('','')}clearEventWarn()}
function warnEvent(){var el=document.getElementById('eventName');el.classList.remove('needEvent');void el.offsetWidth;el.classList.add('needEvent');el.focus();flash('⚠ Nejdřív vyber akci',true)}
function clearEventWarn(){document.getElementById('eventName').classList.remove('needEvent')}
function currentEventFromRides(){var best=null,bt=0;for(var i=0;i<rides.length;i++){var r=rides[i];if(r.end||!r.event)continue;var t=new Date(r.start).getTime()||0;if(t>=bt){bt=t;best={name:r.event,id:r.eventId||''}}}return best}
var _adoptAsked=false;
function maybeAdoptEvent(){if(_adoptAsked)return;if(getEventName())return;var ev=currentEventFromRides();if(!ev)return;_adoptAsked=true;if(confirm('Převzít akci ze sdílených jízd?\n\n„'+ev.name+'“')){document.getElementById('eventName').value=ev.name;currentEventId=ev.id||'';persistEventSelection(ev.name,currentEventId);saveEventName();flash('📋 Akce: '+ev.name)}}
(function(){try{document.getElementById('eventName').value=localStorage.getItem('sw-event')||'';currentEventId=localStorage.getItem('sw-event-id')||''}catch(e){}})();

/* ── URL params ── */
var _p=new URLSearchParams(location.search);var _urlCar=_p.get('car'),_urlCust=_p.get('customer');var _urlEmail=_p.get('email')||'',_urlPhone=_p.get('phone')||'',_urlAddr=_p.get('addr')||'',_urlOP=_p.get('op')||'';var _hasUrlParams=!!(_urlCar||_urlCust);if(_hasUrlParams)history.replaceState(null,'',location.pathname);

/* ── Firebase REST ── */
function fbRest(method,path,data){var p=firebase.auth&&firebase.auth().currentUser?firebase.auth().currentUser.getIdToken():Promise.resolve(null);return p.then(function(token){var url=FB_URL+'/'+path+'.json'+(token?'?auth='+token:'');var opts={method:method,headers:{'Content-Type':'application/json'}};if(data)opts.body=JSON.stringify(data);return fetch(url,opts).then(function(r){return r.json()})})}
function loadRidesREST(){return fbRest('GET','rides').then(function(data){rides=[];if(data){var keys=Object.keys(data);for(var i=0;i<keys.length;i++){var r=data[keys[i]];if(!r||!r.car)continue;r._key=keys[i];rides.push(r)}rides.sort(function(a,b){return new Date(b.start)-new Date(a.start)})}renderAll();_pendingRide=null;if(!_hasUrlParams)maybeAdoptEvent();return rides})}
function loadCustomersREST(){return fbRest('GET','customers').then(function(data){regCustomers=[];if(data){var keys=Object.keys(data);for(var i=0;i<keys.length;i++){var c=data[keys[i]];c._key=keys[i];regCustomers.push(c)}}regCustomers.sort(function(a,b){return(a.name||'').localeCompare(b.name||'','cs')})})}
function loadEventsREST(){return fbRest('GET','events').then(function(data){events=[];if(data){var keys=Object.keys(data);for(var i=0;i<keys.length;i++){var e=data[keys[i]];if(!e||!e.name)continue;e._key=keys[i];events.push(e)}}return events})}
function saveRideREST(ride){var clean={};for(var k in ride)if(k!=='_key'&&ride.hasOwnProperty(k))clean[k]=ride[k];if(clean.customers&&clean.customers.length===0)clean.customers=[];if(ride._key)return fbRest('PUT','rides/'+ride._key,clean).then(function(){return ride});return fbRest('POST','rides',clean).then(function(res){ride._key=res.name;return ride})}
