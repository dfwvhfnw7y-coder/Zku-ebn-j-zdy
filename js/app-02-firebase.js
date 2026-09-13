/* ══════════════════════════════════════
   FIREBASE SDK — init (no listeners until auth)
   ══════════════════════════════════════ */
try{
  firebase.initializeApp({
    apiKey:"AIzaSyAWTBwFNJ2x4_UbHjD1YhS1gf40onwleLQ",
    authDomain:"testovaci-jizdy.firebaseapp.com",
    databaseURL:FB_URL,
    projectId:"testovaci-jizdy",
    storageBucket:"testovaci-jizdy.firebasestorage.app",
    messagingSenderId:"1888708933",
    appId:"1:1888708933:web:0d53b4a2dce008e527762c"
  });
  db=firebase.database();
  fbReady=true;
}catch(e){document.getElementById('syncStatus').textContent='\u{1F7E1}'}

var _v45BootOpenedLocked=!!pinLocked;

function syncFleetRideStats(){
  var cards=document.querySelectorAll('#v44FleetGrid .v44-vehicle');if(!cards.length)return;
  function inEvent(r){var eid=currentEventId||'',ev=(document.getElementById('eventName')||{}).value||'';if(eid&&r.eventId)return r.eventId===eid;return !!ev&&r.event===ev}
  var total=0,active=0,people={};
  for(var i=0;i<rides.length;i++){var r=rides[i];if(!inEvent(r))continue;total++;if(!r.end)active++;var cs=r.customers||[];for(var j=0;j<cs.length;j++){var c=cs[j]||{},k=typeof c==='object'?((c.email||'').toLowerCase()||(c.phone||'').replace(/\s+/g,'')||(c.name||'').toLowerCase()):String(c).toLowerCase();if(k)people[k]=1}}
  for(var x=0;x<cards.length;x++){var nameEl=cards[x].querySelector('.v44-vehicle-name'),countEl=cards[x].querySelector('.v45-ride-count');if(!nameEl||!countEl)continue;var name=nameEl.textContent.trim().toLowerCase(),n=0;for(var y=0;y<rides.length;y++){var rr=rides[y];if(inEvent(rr)&&String(rr.car||'').trim().toLowerCase()===name)n++}countEl.textContent=n+' '+(n===1?'jízda':(n>=2&&n<=4?'jízdy':'jízd'))}
  var sum=document.getElementById('v45LiveSummary');if(sum)sum.innerHTML='<span><b>'+total+'</b> '+(total===1?'jízda':(total>=2&&total<=4?'jízdy':'jízd'))+'</span><i></i><span><b>'+Object.keys(people).length+'</b> zákazníků</span><i></i><span><b>'+active+'</b> vozů venku</span>';
}
function scheduleFleetStats(){setTimeout(syncFleetRideStats,0)}

function initApp(){
  if(!db)return;
  ridesRef=db.ref('rides');
  eventsRef=db.ref('events');
  var customersRef=db.ref('customers');
  ridesRef.on('value',function(snapshot){
    var data=snapshot.val();rides=[];
    if(data){var keys=Object.keys(data);for(var i=0;i<keys.length;i++){var r=data[keys[i]];if(!r||!r.car)continue;r._key=keys[i];rides.push(r)}rides.sort(function(a,b){return new Date(b.start)-new Date(a.start)})}
    renderAll();document.getElementById('syncStatus').textContent='\u{1F7E2}';_pendingRide=null;
    maybeAdoptEvent();scheduleFleetStats();
  });
  customersRef.on('value',function(snapshot){
    var data=snapshot.val();regCustomers=[];
    if(data){var keys=Object.keys(data);for(var i=0;i<keys.length;i++){var c=data[keys[i]];c._key=keys[i];regCustomers.push(c)}}
    regCustomers.sort(function(a,b){return(a.name||'').localeCompare(b.name||'','cs')});
  });
  eventsRef.on('value',function(snapshot){
    var data=snapshot.val();events=[];
    if(data){var keys=Object.keys(data);for(var i=0;i<keys.length;i++){var e=data[keys[i]];if(!e||!e.name)continue;e._key=keys[i];events.push(e)}}
    if(typeof renderEventSelector==='function')renderEventSelector();
    if(currentEventId&&typeof selectEventById==='function')selectEventById(currentEventId,false);
    scheduleFleetStats();
  });
  db.ref('.info/connected').on('value',function(snap){document.getElementById('syncStatus').textContent=snap.val()?'\u{1F7E2}':'\u{1F534}'});
  if(_hasUrlParams){
    loadRidesREST().then(function(){
      if(_urlCar){flash('🚗 '+_urlCar+' · nejdřív vyberte zákazníka v aplikaci',true);if(typeof switchTab==='function')switchTab('scan')}
      else if(_urlCust){showCustConfirm(_urlCust,_urlEmail,_urlPhone,_urlAddr,_urlOP)}
    }).catch(function(err){flash('Chyba: '+err.message,true)});
  }
  if(!fbReady){if(!_hasUrlParams){loadRidesREST();loadCustomersREST();loadEventsREST()}setInterval(function(){loadRidesREST();loadCustomersREST();loadEventsREST()},5000)}
}
function doAuth(){if(!firebase.auth){initApp();return}firebase.auth().signInAnonymously().then(function(){if(_v45BootOpenedLocked){_v45BootOpenedLocked=false;location.reload();return}initApp()}).catch(function(e){console.warn('Auth:',e);initApp()})}
if(!pinLocked)doAuth();

function cleanRide(r){var o={};for(var k in r)if(k!=='_key'&&r.hasOwnProperty(k))o[k]=r[k];return o}
function fbWrite(ride){if(fbReady&&ridesRef){if(ride._key){ridesRef.child(ride._key).set(cleanRide(ride))}else{var ref=ridesRef.push();ride._key=ref.key;ref.set(cleanRide(ride))}return ride}saveRideREST(ride);return ride}
function fbAdd(ride){if(fbReady&&ridesRef){var ref=ridesRef.push();ride._key=ref.key;ref.set(cleanRide(ride));return ride}saveRideREST(ride);return ride}
function fbDeleteAll(){if(fbReady&&ridesRef)ridesRef.remove();else fbRest('DELETE','rides')}

function addCustomerTx(ride,obj){if(fbReady&&ridesRef&&ride._key){ridesRef.child(ride._key).transaction(function(cur){if(cur===null)return cur;if(!cur.customers)cur.customers=[];for(var i=0;i<cur.customers.length;i++){var c=cur.customers[i],cn=(typeof c==='object'?c.name:c);if((cn||'').toLowerCase()===(obj.name||'').toLowerCase()&&(typeof c==='object'?(c.email||''):'')===(obj.email||''))return}cur.customers.push(obj);return cur})}else{if(!ride.customers)ride.customers=[];ride.customers.push(obj);saveRideREST(ride)}}
function endRideTx(key){if(fbReady&&ridesRef){ridesRef.child(key).transaction(function(cur){if(cur===null||cur.end)return cur;cur.end=new Date().toISOString();return cur})}else{var r=findRideByKey(key);if(r){r.end=new Date().toISOString();saveRideREST(r)}}}

function handoffRideTx(oldRides,oldCar,newRide){if(!(fbReady&&db&&ridesRef))return null;var now=new Date().toISOString(),updates={},seen={};for(var i=0;i<(oldRides||[]).length;i++){var r=oldRides[i];if(!r||!r._key||seen[r._key])continue;seen[r._key]=true;updates['rides/'+r._key+'/end']=now;r.end=now}if(oldCar&&oldCar._key&&!seen[oldCar._key]){seen[oldCar._key]=true;updates['rides/'+oldCar._key+'/end']=now;oldCar.end=now}var ref=ridesRef.push();newRide._key=ref.key;updates['rides/'+ref.key]=cleanRide(newRide);db.ref().update(updates);return newRide}
