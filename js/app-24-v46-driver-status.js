/* V46: distinguish waiting for driver from driver already selected */
(function(){
  function paint(){
    var cards=document.querySelectorAll('#v46Cars .v46-car');
    for(var i=0;i<cards.length;i++){
      var badge=cards[i].querySelector('.v46-wait-badge');
      if(!badge)continue;
      var selected=!!cards[i].querySelector('.v46-next-driver');
      badge.textContent=selected?'✓ ŘIDIČ VYBRÁN':'⏸ ČEKÁ NA ŘIDIČE';
      badge.classList.toggle('v46-driver-ready',selected);
    }
  }
  var s=document.createElement('style');
  s.textContent='.v46-wait-badge.v46-driver-ready{background:#173b32!important;color:#83e8c2!important}';
  document.head.appendChild(s);
  document.addEventListener('v46:sync',function(){setTimeout(paint,0);setTimeout(paint,100)});
  document.addEventListener('click',function(){setTimeout(paint,80);setTimeout(paint,320)},true);
  setTimeout(paint,250);
})();