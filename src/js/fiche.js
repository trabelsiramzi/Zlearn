/* ورقة الدرس : impression de la fiche seule (A4). */
(function(){
  "use strict";
  var buttons = document.querySelectorAll("[data-fiche-print]");
  if (!buttons.length || !window.print) return;
  function done(){ document.body.classList.remove("printing-fiche"); }
  window.addEventListener("afterprint", done);
  Array.prototype.forEach.call(buttons, function(button){
    button.addEventListener("click", function(){
      document.body.classList.add("printing-fiche");
      window.print();
      setTimeout(done, 1000);
    });
  });
}());
