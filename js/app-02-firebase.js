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
  });
  db.ref('.info/connected').on('value',function(snap){document.getElementById('syncStatus').textContent=snap.val()?'\u{1F7E2}':'\u{1F534}'});
  if(_hasUrlParams){
    loadRidesREST().then(function(){
      if(_urlCar){
        var ev=document.getElementById('eventName').value.trim();
        if(!ev){var sh=currentEventFromRides();if(sh){ev=sh.name;document.getElementById('eventName').value=sh.name;currentEventId=sh.id||'';persistEventSelection(sh.name,currentEventId);saveEventName()}}
        if(!ev){warnEvent();return}
        var ex=findActiveByCarName(_urlCar);
        var p1=ex?(function(){ex.end=new Date().toISOString();return saveRideREST(ex)})():Promise.resolve();
        p1.then(function(){var nr={car:_urlCar,start:new Date().toISOString(),end:null,customers:[],event:ev,eventId:getCurrentEventId()};return saveRideREST(nr)}).then(function(saved){lastActiveCarId=saved._key;flash('\u{1F697} '+(ex?'Nové kolo: ':'Nová jízda: ')+_urlCar);loadRidesREST()});
      } else if(_urlCust){showCustConfirm(_urlCust,_urlEmail,_urlPhone,_urlAddr,_urlOP)}
    }).catch(function(err){flash('Chyba: '+err.message,true)});
  }
  // REVIZE 01: REST nacitani jen jako fallback, kdyz Firebase SDK neni dostupne.
  // Kdyz fbReady === true, o rides i customers se stara ridesRef.on / customersRef.on
  // (real-time listenery vyse). Soubezny REST polling byl redundantni a zpusoboval
  // prekreslovani UI + race s _pendingRide. Vetev _hasUrlParams (QR/fotoaparat) beze zmeny.
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
