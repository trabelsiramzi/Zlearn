(function () {
  document.querySelectorAll(".group").forEach(function (g) {
    var gkey = "mourshid-" + g.getAttribute("data-key");
    var gstate = {};
    try { gstate = JSON.parse(ZLEARN_STORAGE.getItem(gkey) || "{}") || {}; } catch (e) { gstate = {}; }
    var boxes = Array.prototype.slice.call(g.querySelectorAll(".check input"));
    var label = g.querySelector(".plabel");
    var fill = g.querySelector(".pfill");
    function update() {
      var n = boxes.filter(function (b) { return b.checked; }).length;
      label.textContent = n + " من " + boxes.length;
      fill.style.width = (boxes.length ? (n / boxes.length) * 100 : 0) + "%";
    }
    boxes.forEach(function (b) {
      if (gstate[b.id]) b.checked = true;
      b.addEventListener("change", function () {
        gstate[b.id] = b.checked;
        try { ZLEARN_STORAGE.setItem(gkey, JSON.stringify(gstate)); } catch (e) {}
        update();
      });
    });
    update();
  });

  document.querySelectorAll("textarea[data-key]").forEach(function (ta) {
    var tkey = "mourshid-" + ta.getAttribute("data-key") + "-verses";
    try { var v = ZLEARN_STORAGE.getItem(tkey); if (v) ta.value = v; } catch (e) {}
    ta.addEventListener("input", function () { try { ZLEARN_STORAGE.setItem(tkey, ta.value); } catch (e) {} });
  });
})();
