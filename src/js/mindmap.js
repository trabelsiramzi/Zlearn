
/* Cartes mentales : version simplifiée en cartes sur petit écran (≤ 700 px),
   générée depuis le SVG ; un bouton permet d'afficher la carte complète. */
(function () {
  var doc = document;
  Array.prototype.forEach.call(doc.querySelectorAll(".scroll"), function (box) {
    var svg = box.querySelector("svg");
    if (!svg) return;
    var nodes = svg.querySelectorAll("g.node");
    if (!nodes.length) return;
    var heads = [];
    Array.prototype.forEach.call(svg.querySelectorAll("text.on-hero"), function (t) {
      var s = t.textContent.replace(/\s+/g, " ").trim();
      if (s && heads.indexOf(s) < 0) heads.push(s);
    });
    var wrap = doc.createElement("div");
    wrap.className = "map-list";
    var h = doc.createElement("h3");
    h.textContent = heads.join(" ") || svg.getAttribute("aria-label") || "";
    wrap.appendChild(h);
    var ul = doc.createElement("ul");
    Array.prototype.forEach.call(nodes, function (n) {
      var li = doc.createElement("li");
      var extra = (n.getAttribute("class") || "").replace("node", "").replace(/\s+/g, " ").trim();
      li.className = extra;
      Array.prototype.forEach.call(n.querySelectorAll("text"), function (t) {
        var txt = t.textContent.replace(/\s+/g, " ").trim();
        if (!txt) return;
        var cls = t.getAttribute("class") || "";
        var el = doc.createElement(cls.indexOf("t-title") >= 0 ? "strong" : "p");
        el.textContent = txt;
        li.appendChild(el);
      });
      if (li.firstChild) ul.appendChild(li);
    });
    if (!ul.firstChild) return;
    wrap.appendChild(ul);
    var btn = doc.createElement("button");
    btn.type = "button";
    btn.className = "btn map-toggle";
    btn.textContent = "عرض الخريطة الكاملة";
    btn.setAttribute("aria-pressed", "false");
    btn.addEventListener("click", function () {
      var on = !box.classList.contains("force");
      if (on) { box.classList.add("force"); wrap.classList.add("force"); }
      else { box.classList.remove("force"); wrap.classList.remove("force"); }
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      btn.textContent = on ? "العودة إلى العرض المبسّط" : "عرض الخريطة الكاملة";
    });
    wrap.appendChild(btn);
    box.classList.add("has-list");
    box.parentNode.insertBefore(wrap, box.nextSibling);
  });
})();
