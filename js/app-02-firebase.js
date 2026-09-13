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

function initApp(){
  if(!db)return;
  ridesRef=db.ref('rides');
  eventsRef=db.ref('events');
  var customersRef=db.ref('customers');
  ridesRef.on('value',function(snapshot){
    var data=snapshot.val();rides=[];
    if(data){var keys=Object.keys(data);for(var i=0;i<keys.length;i++){var r=data[keys[i]];if(!r||!r.car)continue;r._key=keys[i];rides.push(r)}rides.sort(function(a,b){return new Date(b.start)-new Date(a.start)})}
    renderAll();document.getElementById('syncStatus').textContent='\u{1F7E2}';_pendingRide=null;
    maybeAdoptEvent();
  });
  customersRef.on('value',function(snapshot){
    var data=snapshot.val();regCustomers=[];
    if(data){var keys=Object.keys(data);for(var i=0;i<keys.length;i++){var c=data[keys[i]];c._key=keys[i];regCustomers.push(c)}}
    regCustomers.sort(function(a,b){return(a.name||'').localeCompare(b.name||'','cs')});
  });
  eventsRef.on('value',function(snapshot){
    var data=snapshot.val();events=[];
    if(data){var keys=Object.keys(data);for(var i=0;i<keys.length;i++){var e=data[keys[i]];if(!e||!e.name)continue;e._key=keys[i];events.push(e)}}
    /* Critical after PIN unlock: event UI was already rendered before auth.
       Re-render now that Firebase events really exist, then wake the fleet
       listener for the restored event. */
    if(typeof renderEventSelector==='function')renderEventSelector();
    if(currentEventId&&typeof selectEventById==='function')selectEventById(currentEventId,false);
    if(typeof window.v44FleetReload==='function')window.v44FleetReload();
  });
  db.ref('.info/connected').on('value',function(snap){document.getElementById('syncStatus').textContent=snap.val()?'\u{1F7E2}':'\u{1F534}'});
  if(_hasUrlParams){
    loadRidesREST().then(function(){
      if(_urlCar){
        flash('🚗 '+_urlCar+' · nejdřív vyberte zákazníka v aplikaci',true);
        if(typeof switchTab==='function')switchTab('scan');
      } else if(_urlCust){showCustConfirm(_urlCust,_urlEmail,_urlPhone,_urlAddr,_urlOP)}
    }).catch(function(err){flash('Chyba: '+err.message,true)});
  }
  if(!fbReady){
    if(!_hasUrlParams){loadRidesREST();loadCustomersREST();loadEventsREST()}
    setInterval(function(){loadRidesREST();loadCustomersREST();loadEventsREST()},5000);
  }
}
function doAuth(){
  if(!firebase.auth){initApp();return}
  firebase.auth().signInAnonymously().then(function(){initApp()}).catch(function(e){console.warn('Auth:',e);initApp()});
}
if(!pinLocked)doAuth();

/* ── Write helpers — SDK if available, REST fallback ── */
function cleanRide(r){var o={};for(var k in r)if(k!=='_key'&&r.hasOwnProperty(k))o[k]=r[k];return o}
function fbWrite(ride){
  if(fbReady&&ridesRef){
    if(ride._key){ridesRef.child(ride._key).set(cleanRide(ride))}
    else{var ref=ridesRef.push();ride._key=ref.key;ref.set(cleanRide(ride))}
    return ride;
  }
  saveRideREST(ride);return ride;
}
function fbAdd(ride){
  if(fbReady&&ridesRef){var ref=ridesRef.push();ride._key=ref.key;ref.set(cleanRide(ride));return ride}
  saveRideREST(ride);return ride;
}
function fbDeleteAll(){
  if(fbReady&&ridesRef)ridesRef.remove();
  else fbRest('DELETE','rides');
}

/* ── REVIZE 02B: atomické zápisy přes transaction() (bez změny datového modelu) ── */
function addCustomerTx(ride,obj){
  if(fbReady&&ridesRef&&ride._key){
    ridesRef.child(ride._key).transaction(function(cur){
      if(cur===null)return cur;
      if(!cur.customers)cur.customers=[];
      for(var i=0;i<cur.customers.length;i++){
        var c=cur.customers[i],cn=(typeof c==='object'?c.name:c);
        if((cn||'').toLowerCase()===(obj.name||'').toLowerCase()
           &&(typeof c==='object'?(c.email||''):'')===(obj.email||''))return;
      }
      cur.customers.push(obj);
      return cur;
    });
  } else {
    if(!ride.customers)ride.customers=[];
    ride.customers.push(obj);
    saveRideREST(ride);
  }
}
function endRideTx(key){
  if(fbReady&&ridesRef){
    ridesRef.child(key).transaction(function(cur){
      if(cur===null||cur.end)return cur;
      cur.end=new Date().toISOString();
      return cur;
    });
  } else { var r=findRideByKey(key);if(r){r.end=new Date().toISOString();saveRideREST(r)} }
}

/* V44: one multi-location write for customer -> vehicle handoff. */
function handoffRideTx(oldRides,oldCar,newRide){
  if(!(fbReady&&db&&ridesRef))return null;
  var now=new Date().toISOString(),updates={},seen={};
  for(var i=0;i<(oldRides||[]).length;i++){var r=oldRides[i];if(!r||!r._key||seen[r._key])continue;seen[r._key]=true;updates['rides/'+r._key+'/end']=now;r.end=now}
  if(oldCar&&oldCar._key&&!seen[oldCar._key]){seen[oldCar._key]=true;updates['rides/'+oldCar._key+'/end']=now;oldCar.end=now}
  var ref=ridesRef.push();newRide._key=ref.key;updates['rides/'+ref.key]=cleanRide(newRide);
  db.ref().update(updates);
  return newRide;
}
